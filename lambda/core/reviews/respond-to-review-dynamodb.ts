import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { getCacheInvalidator } from '../shared/utils/cache-invalidation';
import { logger } from '../shared/utils/logger';

const respondSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters').max(1000, 'Response must be at most 1000 characters').trim(),
});

async function respondToReviewHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId, role } = event.auth;

  if (role !== 'MASTER') {
    return forbidden('Only masters can respond to reviews');
  }

  const reviewId = event.pathParameters?.id;
  if (!reviewId) {
    return badRequest('Review ID is required');
  }

  logger.info('Respond to review request', { userId, reviewId });

  const body = JSON.parse(event.body || '{}');
  const validationResult = respondSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const { response } = validationResult.data;

  const reviewRepo = new ReviewRepository();
  
  const review = await reviewRepo.findById(userId, reviewId);
  if (!review) {
    return notFound('Review not found or you do not have permission to respond');
  }

  const updated = await reviewRepo.addResponse(userId, reviewId, response);
  
  const cacheInvalidator = getCacheInvalidator();
  await cacheInvalidator.invalidateReviewCache(userId);
  
  logger.info('Response added to review', { userId, reviewId });

  return success(updated);
}

export const handler = withErrorHandler(withAuth(respondToReviewHandler, { roles: ['MASTER'] }));
