// Rating calculation worker (triggered by SQS)

import type { SQSEvent } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { cache } from '@/shared/cache/client';
import { logger } from '@/shared/utils/logger';

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
  
  const prisma = getPrismaClient();
  
  // Get all reviews for master
  const reviews = await prisma.review.findMany({
    where: { masterId },
    include: {
      project: {
        select: {
          budget: true,
          completedAt: true,
        },
      },
    },
  });
  
  if (reviews.length === 0) {
    logger.info('No reviews found', { masterId });
    return;
  }
  
  // Calculate weighted average
  let totalWeightedRating = 0;
  let totalWeight = 0;
  
  const now = Date.now();
  
  for (const review of reviews) {
    // Weight by project cost (normalized)
    const costWeight = Math.log10(review.project.budget + 1);
    
    // Weight by recency (decay over 365 days)
    const daysSinceCompletion = review.project.completedAt
      ? (now - review.project.completedAt.getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    const recencyWeight = Math.exp(-daysSinceCompletion / 365);
    
    const weight = costWeight * recencyWeight;
    
    totalWeightedRating += review.rating * weight;
    totalWeight += weight;
  }
  
  // Calculate final rating (round to 0.1)
  const rating = Math.round((totalWeightedRating / totalWeight) * 10) / 10;
  
  // Update master profile
  await prisma.masterProfile.update({
    where: { id: masterId },
    data: { 
      rating,
      totalReviews: reviews.length,
    },
  });
  
  // Invalidate cache
  await cache.delete(`master:${masterId}`);
  
  logger.info('Master rating updated', { masterId, rating });
}
