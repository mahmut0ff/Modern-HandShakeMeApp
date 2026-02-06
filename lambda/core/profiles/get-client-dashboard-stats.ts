/**
 * Get Client Dashboard Stats
 * Получение статистики для dashboard клиента
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TABLE_NAME } from '../shared/db/dynamodb-client';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Support both API Gateway authorizer formats
    const userId = event.requestContext.authorizer?.claims?.sub 
      || event.requestContext.authorizer?.userId;

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
    const activeOrdersResult = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}#ORDERS`,
          ':status': 'active',
        },
        Select: 'COUNT',
      })
    );

    // Get completed orders count
    const completedOrdersResult = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}#ORDERS`,
          ':status': 'completed',
        },
        Select: 'COUNT',
      })
    );

    // Get all completed orders to calculate total spent
    const completedOrders = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}#ORDERS`,
          ':status': 'completed',
        },
        ProjectionExpression: 'budgetMin, budgetMax',
      })
    );

    // Calculate total spent (approximate from budgets)
    const totalSpent = (completedOrders.Items || []).reduce((sum, order) => {
      const budget = order.budgetMax || order.budgetMin || 0;
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
