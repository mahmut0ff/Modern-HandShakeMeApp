/**
 * Get Client Dashboard Stats
 * Получение статистики для dashboard клиента
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'orders';
const MASTERS_TABLE = process.env.MASTERS_TABLE || 'masters';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Get active orders count
    const activeOrdersResult = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: 'ClientStatusIndex',
        KeyConditionExpression: 'client_id = :clientId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':clientId': userId,
          ':status': 'active',
        },
        Select: 'COUNT',
      })
    );

    // Get completed orders count
    const completedOrdersResult = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: 'ClientStatusIndex',
        KeyConditionExpression: 'client_id = :clientId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':clientId': userId,
          ':status': 'completed',
        },
        Select: 'COUNT',
      })
    );

    // Get all completed orders to calculate total spent
    const completedOrders = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: 'ClientStatusIndex',
        KeyConditionExpression: 'client_id = :clientId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':clientId': userId,
          ':status': 'completed',
        },
        ProjectionExpression: 'budget_min, budget_max',
      })
    );

    // Calculate total spent (approximate from budgets)
    const totalSpent = (completedOrders.Items || []).reduce((sum, order) => {
      const budget = order.budget_max || order.budget_min || 0;
      return sum + Number(budget);
    }, 0);

    // Get favorite masters count (if you have a favorites table)
    // For now, returning 0 as placeholder
    const favoriteMasters = 0;

    const stats = {
      active_orders: activeOrdersResult.Count || 0,
      completed_orders: completedOrdersResult.Count || 0,
      total_spent: totalSpent,
      favorite_masters: favoriteMasters,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error('Error getting client dashboard stats:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to get dashboard stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
