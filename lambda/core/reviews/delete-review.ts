import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { getCacheInvalidator } from '../shared/utils/cache-invalidation';
import { logger } from '../shared/utils/logger';

async function deleteReviewHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId, role } = event.auth;
  const reviewId = event.pathParameters?.id;
  
  if (!reviewId) {
    return badRequest('Review ID is required');
  }
  
  if (role !== 'CLIENT') {
    return forbidden('Only clients can delete reviews');
  }
  
  logger.info('Delete review request', { userId, reviewId });
  
  const reviewRepo = new ReviewRepository();
  const masterProfileRepo = new MasterProfileRepository();
  
  const clientReviewsResult = await reviewRepo.findByClient(userId);
  const review = clientReviewsResult.items.find(r => r.id === reviewId);
  
  if (!review) {
    return notFound('Review not found or you do not have permission to delete it');
  }
  
  const masterId = review.masterId;
  
  await reviewRepo.delete(masterId, reviewId);
  
  const masterReviewsResult = await reviewRepo.findByMaster(masterId, { limit: 1000 });
  const masterReviews = masterReviewsResult.items;
  
  if (masterReviews.length > 0) {
    const avgRating = masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length;
    await masterProfileRepo.updateRating(masterId, avgRating, masterReviews.length);
  } else {
    await masterProfileRepo.updateRating(masterId, 0, 0);
  }
  
  const cacheInvalidator = getCacheInvalidator();
  await cacheInvalidator.invalidateReviewCache(masterId);
  
  logger.info('Review deleted', { userId, reviewId, masterId });
  
  return success({ message: 'Review deleted successfully' });
}

export const handler = withErrorHandler(withAuth(deleteReviewHandler, { roles: ['CLIENT'] }));
