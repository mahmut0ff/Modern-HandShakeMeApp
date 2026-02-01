/**
 * Get Master Dashboard Stats
 * Получение статистики для dashboard мастера
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'orders';
const APPLICATIONS_TABLE = process.env.APPLICATIONS_TABLE || 'applications';
const MASTERS_TABLE = process.env.MASTERS_TABLE || 'masters';
const CHAT_ROOMS_TABLE = process.env.CHAT_ROOMS_TABLE || 'chat_rooms';

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

    // Get master profile to get rating
    const masterProfile = await docClient.send(
      new GetCommand({
        TableName: MASTERS_TABLE,
        Key: { user_id: userId },
      })
    );

    // Get active orders count (orders where master is assigned)
    const activeOrdersResult = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: 'MasterStatusIndex',
        KeyConditionExpression: 'master_id = :masterId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':masterId': userId,
          ':status': 'in_progress',
        },
        Select: 'COUNT',
      })
    );

    // Get completed orders count
    const completedOrdersResult = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: 'MasterStatusIndex',
        KeyConditionExpression: 'master_id = :masterId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':masterId': userId,
          ':status': 'completed',
        },
        Select: 'COUNT',
      })
    );

    // Get all completed orders to calculate total earned
    const completedOrders = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: 'MasterStatusIndex',
        KeyConditionExpression: 'master_id = :masterId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':masterId': userId,
          ':status': 'completed',
        },
        ProjectionExpression: 'budget_min, budget_max, final_price',
      })
    );

    // Calculate total earned
    const totalEarned = (completedOrders.Items || []).reduce((sum, order) => {
      const earned = order.final_price || order.budget_max || order.budget_min || 0;
      return sum + Number(earned);
    }, 0);

    // Get pending applications count
    const pendingApplicationsResult = await docClient.send(
      new QueryCommand({
        TableName: APPLICATIONS_TABLE,
        IndexName: 'MasterStatusIndex',
        KeyConditionExpression: 'master_id = :masterId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':masterId': userId,
          ':status': 'pending',
        },
        Select: 'COUNT',
      })
    );

    // Get unread messages count (simplified - would need proper chat implementation)
    const unreadMessages = 0; // Placeholder

    const stats = {
      active_orders: activeOrdersResult.Count || 0,
      completed_orders: completedOrdersResult.Count || 0,
      total_earned: totalEarned,
      average_rating: masterProfile.Item?.rating || 0,
      pending_applications: pendingApplicationsResult.Count || 0,
      unread_messages: unreadMessages,
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
    console.error('Error getting master dashboard stats:', error);
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
