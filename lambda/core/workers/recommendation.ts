// Recommendation worker (triggered by order.created event)

import type { SQSEvent } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { cache } from '@/shared/cache/client';
import { createNotification } from '@/shared/services/notification';
import { logger } from '@/shared/utils/logger';

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
  logger.info('Finding matching masters', { orderId, categoryId });
  
  const prisma = getPrismaClient();
  
  // Find masters with matching category and skills
  const masters = await prisma.masterProfile.findMany({
    where: {
      categories: {
        some: { id: categoryId },
      },
      availability: 'AVAILABLE',
      hourlyRate: { lte: budget },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { rating: 'desc' },
      { completedProjects: 'desc' },
    ],
    take: 10,
  });
  
  if (masters.length === 0) {
    logger.info('No matching masters found', { orderId });
    return;
  }
  
  // Cache recommendations
  const cacheKey = `recommendations:${orderId}`;
  await cache.set(cacheKey, masters, 3600); // 1 hour
  
  // Send notifications to top 5 masters
  const topMasters = masters.slice(0, 5);
  
  for (const master of topMasters) {
    await createNotification({
      userId: master.userId,
      type: 'NEW_ORDER_MATCH',
      title: 'New Order Match',
      message: `A new order matching your skills is available!`,
      data: { orderId },
    });
  }
  
  logger.info('Recommendations sent', { 
    orderId,
    masterCount: topMasters.length,
  });
}
