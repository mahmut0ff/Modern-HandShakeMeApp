// Rating calculation worker (triggered by SQS)
//
// This worker calculates weighted ratings for masters based on their reviews.
// It's triggered by SQS messages when a new review is created.
//
// Event format:
// {
//   "detail": {
//     "data": {
//       "masterId": "uuid"
//     }
//   }
// }
//
// The rating calculation uses:
// - Cost weight: Higher budget projects have more weight (logarithmic scale)
// - Recency weight: Recent reviews have more weight (exponential decay over 365 days)
//
// To trigger this worker, send a message to the rating-calculation SQS queue:
// aws sqs send-message --queue-url <queue-url> --message-body '{"detail":"{\"data\":{\"masterId\":\"uuid\"}}"}'

import type { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { cache } from '../shared/cache/client';
import { logger } from '../shared/utils/logger';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export async function handler(event: SQSEvent): Promise<void> {
  logger.info('Rating calculation worker triggered', { 
    recordCount: event.Records.length 
  });
  
  for (const record of event.Records) {
    try {
      const eventData = JSON.parse(record.body);
      const detail = JSON.parse(eventData.detail);
      const { masterId } = detail.data;
      
      await calculateMasterRating(masterId);
    } catch (error) {
      logger.error('Failed to process rating calculation', error, {
        messageId: record.messageId,
      });
      throw error; // Retry via SQS
    }
  }
}

async function calculateMasterRating(masterId: string): Promise<void> {
  logger.info('Calculating master rating', { masterId });
  
  // Get all reviews for master
  const reviewsResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `MASTER#${masterId}`,
      ':sk': 'REVIEW#'
    }
  }));
  
  const reviews = reviewsResult.Items || [];
  
  if (reviews.length === 0) {
    logger.info('No reviews found', { masterId });
    return;
  }
  
  // Get project details for each review
  const reviewsWithProjects = await Promise.all(
    reviews.map(async (review: any) => {
      if (!review.projectId) return { ...review, project: null };
      
      const projectResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${review.projectId}`,
          ':sk': `METADATA#${review.projectId}`
        }
      }));
      
      return {
        ...review,
        project: projectResult.Items?.[0] || null
      };
    })
  );
  
  // Calculate weighted average
  let totalWeightedRating = 0;
  let totalWeight = 0;
  
  const now = Date.now();
  
  for (const review of reviewsWithProjects) {
    const budget = review.project?.budget || 1000; // Default budget if not found
    const completedAt = review.project?.completedAt;
    
    // Weight by project cost (normalized)
    const costWeight = Math.log10(budget + 1);
    
    // Weight by recency (decay over 365 days)
    const daysSinceCompletion = completedAt
      ? (now - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    const recencyWeight = Math.exp(-daysSinceCompletion / 365);
    
    const weight = costWeight * recencyWeight;
    
    totalWeightedRating += (review.rating || 0) * weight;
    totalWeight += weight;
  }
  
  // Calculate final rating (round to 0.1)
  const rating = Math.round((totalWeightedRating / totalWeight) * 10) / 10;
  
  // Update master profile
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${masterId}`,
      SK: `MASTER_PROFILE#${masterId}`
    },
    UpdateExpression: 'SET rating = :rating, totalReviews = :totalReviews, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':rating': rating,
      ':totalReviews': reviews.length,
      ':updatedAt': new Date().toISOString()
    }
  }));
  
  // Invalidate cache
  await cache.delete(`master:${masterId}`);
  
  logger.info('Master rating updated', { masterId, rating, totalReviews: reviews.length });
}
