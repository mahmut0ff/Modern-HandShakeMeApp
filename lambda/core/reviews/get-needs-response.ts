import type { APIGatewayProxyResult } from 'aws-lambda';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { logger } from '../shared/utils/logger';

async function getNeedsResponseHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  
  logger.info('Get reviews needing response', { userId });
  
  const reviewRepo = new ReviewRepository();
  const userRepo = new UserRepository();
  const orderRepo = new OrderRepository();
  
  const reviews = await reviewRepo.getReviewsNeedingResponse(userId);
  
  const enrichedReviews = await Promise.all(
    reviews.map(async (review) => {
      const [client, order] = await Promise.all([
        userRepo.findById(review.clientId),
        orderRepo.findById(review.orderId)
      ]);
      
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        isAnonymous: review.isAnonymous,
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt,
        client: review.isAnonymous ? null : client ? {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          avatar: client.avatar
        } : null,
        order: order ? {
          id: order.id,
          title: order.title
        } : null,
        tags: review.tags,
        images: review.images
      };
    })
  );
  
  logger.info('Reviews needing response fetched', { userId, count: enrichedReviews.length });
  
  return success(enrichedReviews);
}

export const handler = withErrorHandler(withAuth(getNeedsResponseHandler, { roles: ['MASTER'] }));
