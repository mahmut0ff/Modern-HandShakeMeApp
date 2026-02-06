import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { getCacheInvalidator } from '../shared/utils/cache-invalidation';
import { logger } from '../shared/utils/logger';

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000).trim().optional(),
  isAnonymous: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

async function updateReviewHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId, role } = event.auth;

  if (role !== 'CLIENT') {
    return forbidden('Only clients can update reviews');
  }

  const reviewId = event.pathParameters?.id;
  if (!reviewId) {
    return badRequest('Review ID is required');
  }

  logger.info('Update review request', { userId, reviewId });

  const body = JSON.parse(event.body || '{}');
  const validationResult = updateReviewSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;

  const reviewRepo = new ReviewRepository();
  const masterProfileRepo = new MasterProfileRepository();
  
  const clientReviewsResult = await reviewRepo.findByClient(userId);
  const review = clientReviewsResult.items.find(r => r.id === reviewId);
  
  if (!review) {
    return notFound('Review not found or you do not have permission to update it');
  }
  
  const masterId = review.masterId;

  const updatedReview = await reviewRepo.update(masterId, reviewId, {
    rating: data.rating,
    comment: data.comment,
    isAnonymous: data.isAnonymous,
    tags: data.tags,
    images: data.images,
  });

  if (data.rating !== undefined) {
    const masterReviewsResult = await reviewRepo.findByMaster(masterId, { limit: 1000 });
    const masterReviews = masterReviewsResult.items;
    const avgRating = masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length;
    await masterProfileRepo.updateRating(masterId, avgRating, masterReviews.length);
  }
  
  const cacheInvalidator = getCacheInvalidator();
  await cacheInvalidator.invalidateReviewCache(masterId);
  
  logger.info('Review updated', { userId, reviewId, masterId });

  return success(updatedReview);
}

export const handler = withErrorHandler(withAuth(updateReviewHandler, { roles: ['CLIENT'] }));
