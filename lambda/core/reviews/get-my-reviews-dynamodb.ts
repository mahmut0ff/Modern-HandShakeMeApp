import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, error } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { logger } from '../shared/utils/logger';

async function getMyReviewsHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId, role } = event.auth;
  
  logger.info('Get my reviews request', { userId, role });

  const reviewRepo = new ReviewRepository();
  const userRepo = new UserRepository();
  const orderRepo = new OrderRepository();
  
  let reviewsResult;
  
  if (role === 'MASTER') {
    reviewsResult = await reviewRepo.findByMaster(userId, { limit: 100 });
  } else if (role === 'CLIENT') {
    reviewsResult = await reviewRepo.findByClient(userId, { limit: 100 });
  } else {
    return error('Invalid role', 400);
  }

  const reviews = reviewsResult.items;

  const enrichedReviews = await Promise.all(
    reviews.map(async (review) => {
      const [client, master, order] = await Promise.all([
        userRepo.findById(review.clientId),
        userRepo.findById(review.masterId),
        orderRepo.findById(review.orderId)
      ]);
      
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        isAnonymous: review.isAnonymous,
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount,
        response: review.response,
        responseAt: review.responseAt,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        client: review.isAnonymous ? null : client ? {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          avatar: client.avatar
        } : null,
        master: master ? {
          id: master.id,
          firstName: master.firstName,
          lastName: master.lastName,
          avatar: master.avatar
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

  logger.info('Reviews fetched', { userId, count: enrichedReviews.length });
  return success(enrichedReviews);
}

export const handler = withErrorHandler(withAuth(getMyReviewsHandler));
