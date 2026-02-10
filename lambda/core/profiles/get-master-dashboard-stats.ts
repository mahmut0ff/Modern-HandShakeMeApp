/**
 * Get Master Dashboard Stats
 * Получение статистики для dashboard мастера
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, getItem, TABLE_NAME } from '../shared/db/dynamodb-client';
import { Keys } from '../shared/db/dynamodb-keys';
import { logger } from '../shared/utils/logger';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Support both API Gateway authorizer formats
    const userId = event.requestContext.authorizer?.userId
      || event.requestContext.authorizer?.claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false,
          error: { message: 'Unauthorized - no user ID found' }
        }),
      };
    }

    logger.info('Getting master dashboard stats', { userId });

    // Get user profile
    const user = await getItem(Keys.user(userId));
    
    // Get orders where user is master (using GSI)
    let activeOrders = 0;
    let completedOrders = 0;
    let totalEarned = 0;
    let pendingApplications = 0;

    try {
      // Query orders by master
      const orders = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `MASTER#${userId}`,
        },
      });

      for (const order of orders) {
        if (order.status === 'IN_PROGRESS' || order.status === 'in_progress') {
          activeOrders++;
        } else if (order.status === 'COMPLETED' || order.status === 'completed') {
          completedOrders++;
          totalEarned += Number(order.finalPrice || order.budgetMax || order.budgetMin || 0);
        }
      }
    } catch (e) {
      logger.warn('Could not query orders', { error: e });
    }

    try {
      // Query applications by master
      const applications = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':pk': `MASTER#${userId}`,
          ':status': 'PENDING',
        },
      });
      pendingApplications = applications.length;
    } catch (e) {
      logger.warn('Could not query applications', { error: e });
    }

    // Get unread messages count
    let unreadMessages = 0;
    try {
      const rooms = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}#ROOMS`,
        },
      });
      
      for (const room of rooms) {
        unreadMessages += Number(room.unreadCount || 0);
      }
    } catch (e) {
      logger.warn('Could not query chat rooms', { error: e });
    }

    const stats = {
      active_orders: activeOrders,
      completed_orders: completedOrders,
      total_earned: totalEarned,
      average_rating: user?.rating || 0,
      pending_applications: pendingApplications,
      unread_messages: unreadMessages,
    };

    logger.info('Master dashboard stats retrieved', { userId, stats });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: stats
      }),
    };
  } catch (error) {
    logger.error('Error getting master dashboard stats', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: 'Failed to get dashboard stats',
          details: error instanceof Error ? error.message : 'Unknown error',
        }
      }),
    };
  }
};
