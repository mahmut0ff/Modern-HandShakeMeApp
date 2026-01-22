// Mark review as helpful

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function markHelpfulHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const reviewId = event.pathParameters?.id;
  
  if (!reviewId) {
    return notFound('Review ID is required');
  }
  
  logger.info('Mark review helpful request', { userId, reviewId });
  
  const prisma = getPrismaClient();
  
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  
  if (!review) {
    return notFound('Review not found');
  }
  
  // Check if already marked helpful
  const existing = await prisma.reviewHelpful.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId,
      },
    },
  });
  
  if (existing) {
    // Remove helpful mark
    await prisma.reviewHelpful.delete({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });
    
    return success({ message: 'Helpful mark removed', isHelpful: false });
  } else {
    // Add helpful mark
    await prisma.reviewHelpful.create({
      data: {
        reviewId,
        userId,
      },
    });
    
    return success({ message: 'Review marked as helpful', isHelpful: true });
  }
}

export const handler = withErrorHandler(withRequestTransform(withAuth(markHelpfulHandler)));
