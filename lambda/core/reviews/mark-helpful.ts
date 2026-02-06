import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { logger } from '../shared/utils/logger';

async function markHelpfulHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  const reviewId = event.pathParameters?.id;
  const masterId = event.pathParameters?.masterId;
  
  if (!reviewId) {
    return badRequest('Review ID is required');
  }
  
  if (!masterId) {
    return badRequest('Master ID is required');
  }
  
  logger.info('Mark helpful request', { userId, reviewId, masterId });
  
  const reviewRepo = new ReviewRepository();
  
  const review = await reviewRepo.findById(masterId, reviewId);
  
  if (!review) {
    return notFound('Review not found');
  }
  
  const isAlreadyHelpful = await reviewRepo.isMarkedHelpful(reviewId, userId);
  
  if (isAlreadyHelpful) {
    await reviewRepo.unmarkHelpful(reviewId, userId);
    await reviewRepo.decrementHelpfulCount(masterId, reviewId);
    
    logger.info('Helpful mark removed', { userId, reviewId });
    return success({ message: 'Helpful mark removed', isHelpful: false });
  } else {
    await reviewRepo.markHelpful(reviewId, userId);
    await reviewRepo.incrementHelpfulCount(masterId, reviewId);
    
    logger.info('Review marked as helpful', { userId, reviewId });
    return success({ message: 'Review marked as helpful', isHelpful: true });
  }
}

export const handler = withErrorHandler(withAuth(markHelpfulHandler));
