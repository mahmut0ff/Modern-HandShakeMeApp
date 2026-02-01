// Recommendation worker (triggered by order.created event)
//
// This worker finds matching masters for new orders and sends notifications.
// It's triggered by SQS messages when a new order is created.
//
// Event format:
// {
//   "detail": {
//     "data": {
//       "orderId": "uuid",
//       "categoryId": "uuid",
//       "budget": 5000
//     }
//   }
// }
//
// The worker:
// 1. Finds masters matching the category and budget
// 2. Sorts by rating and completed projects
// 3. Caches top 10 recommendations for 1 hour
// 4. Sends notifications to top 5 masters
//
// To trigger this worker, send a message to the recommendation SQS queue:
// aws sqs send-message --queue-url <queue-url> --message-body '{"detail":"{\"data\":{\"orderId\":\"uuid\",\"categoryId\":\"uuid\",\"budget\":5000}}"}'

import type { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { cache } from '../shared/cache/client';
import { NotificationService } from '../shared/services/notification';
import { logger } from '../shared/utils/logger';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export async function handler(event: SQSEvent): Promise<void> {
  logger.info('Recommendation worker triggered', { 
    recordCount: event.Records.length 
  });
  
  for (const record of event.Records) {
    try {
      const eventData = JSON.parse(record.body);
      const detail = JSON.parse(eventData.detail);
      const { orderId, categoryId, budget } = detail.data;
      
      await findMatchingMasters(orderId, categoryId, budget);
    } catch (error) {
      logger.error('Failed to process recommendation', error, {
        messageId: record.messageId,
      });
      throw error;
    }
  }
}

async function findMatchingMasters(
  orderId: string,
  categoryId: string,
  budget: number
): Promise<void> {
  logger.info('Finding matching masters', { orderId, categoryId, budget });
  
  // Get all master profiles
  const mastersResult = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'begins_with(SK, :sk) AND availability = :availability AND hourlyRate <= :budget',
    ExpressionAttributeValues: {
      ':sk': 'MASTER_PROFILE#',
      ':availability': 'AVAILABLE',
      ':budget': budget
    }
  }));
  
  let masters = mastersResult.Items || [];
  
  // Filter by category if provided
  if (categoryId) {
    masters = masters.filter(master => {
      const categories = master.categories || [];
      return categories.some((cat: any) => cat.id === categoryId || cat === categoryId);
    });
  }
  
  if (masters.length === 0) {
    logger.info('No matching masters found', { orderId, categoryId });
    return;
  }
  
  // Sort by rating and completed projects
  masters.sort((a, b) => {
    const ratingDiff = (b.rating || 0) - (a.rating || 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.completedProjects || 0) - (a.completedProjects || 0);
  });
  
  // Take top 10
  const topMasters = masters.slice(0, 10);
  
  // Get user details for each master
  const mastersWithUsers = await Promise.all(
    topMasters.map(async (master: any) => {
      const userResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `USER#${master.userId}`,
          ':sk': `METADATA#${master.userId}`
        }
      }));
      
      return {
        ...master,
        user: userResult.Items?.[0] || null
      };
    })
  );
  
  // Cache recommendations
  const cacheKey = `recommendations:${orderId}`;
  await cache.set(cacheKey, mastersWithUsers, 3600); // 1 hour
  
  // Send notifications to top 5 masters
  const notificationService = new NotificationService();
  const notificationMasters = mastersWithUsers.slice(0, 5);
  
  for (const master of notificationMasters) {
    try {
      await notificationService.sendNotification({
        userId: master.userId,
        type: 'ORDER',
        title: 'New Order Match',
        message: 'A new order matching your skills is available!',
        data: { orderId },
      });
    } catch (error) {
      logger.error('Failed to send notification to master', error, {
        masterId: master.userId,
        orderId
      });
      // Continue with other notifications even if one fails
    }
  }
  
  logger.info('Recommendations sent', { 
    orderId,
    totalMasters: masters.length,
    notifiedMasters: notificationMasters.length,
  });
}
