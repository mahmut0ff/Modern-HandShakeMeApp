// Delete review Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function deleteReviewHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const reviewId = event.pathParameters?.id;
  
  if (!reviewId) {
    return badRequest('Review ID is required');
  }
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can delete reviews');
  }
  
  logger.info('Delete review', { userId, reviewId });
  
  const prisma = getPrismaClient();
  
  // Get client profile
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (!clientProfile) {
    return notFound('Client profile not found');
  }
  
  // Get review
  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) }
  });
  
  if (!review) {
    return notFound('Review not found');
  }
  
  // Verify ownership
  if (review.clientId !== clientProfile.id) {
    return forbidden('You can only delete your own reviews');
  }
  
  const masterId = review.masterId;
  
  // Delete review
  await prisma.review.delete({
    where: { id: parseInt(reviewId) }
  });
  
  // Recalculate master rating
  const masterReviews = await prisma.review.findMany({
    where: { masterId },
    select: { rating: true }
  });
  
  if (masterReviews.length > 0) {
    const avgRating = masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length;
    
    await prisma.masterProfile.update({
      where: { id: masterId },
      data: {
        rating: avgRating,
        reviewsCount: masterReviews.length
      }
    });
  } else {
    await prisma.masterProfile.update({
      where: { id: masterId },
      data: {
        rating: 0,
        reviewsCount: 0
      }
    });
  }
  
  logger.info('Review deleted', { reviewId });
  
  return success({ message: 'Review deleted successfully' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(deleteReviewHandler)));
