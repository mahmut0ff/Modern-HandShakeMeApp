// Get review statistics for a master

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getReviewStatsHandler(
  event: any
): Promise<APIGatewayProxyResult> {
  const masterId = event.pathParameters?.id;
  
  if (!masterId) {
    return notFound('Master ID is required');
  }
  
  logger.info('Get review stats request', { masterId });
  
  const prisma = getPrismaClient();
  
  const master = await prisma.user.findUnique({
    where: { id: masterId },
  });
  
  if (!master || master.role !== 'MASTER') {
    return notFound('Master not found');
  }
  
  // Get all reviews
  const reviews = await prisma.review.findMany({
    where: { toUserId: masterId },
  });
  
  const totalReviews = reviews.length;
  
  if (totalReviews === 0) {
    return success({
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }
  
  // Calculate average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / totalReviews;
  
  // Calculate rating distribution
  const ratingDistribution = {
    1: reviews.filter(r => r.rating === 1).length,
    2: reviews.filter(r => r.rating === 2).length,
    3: reviews.filter(r => r.rating === 3).length,
    4: reviews.filter(r => r.rating === 4).length,
    5: reviews.filter(r => r.rating === 5).length,
  };
  
  return success({
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
  });
}

export const handler = withErrorHandler(withRequestTransform(getReviewStatsHandler));
