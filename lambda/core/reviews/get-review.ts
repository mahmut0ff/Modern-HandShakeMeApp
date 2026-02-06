import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { logger } from '../shared/utils/logger';

async function getReviewHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const reviewId = event.pathParameters?.id;
  const masterId = event.pathParameters?.masterId;
  
  if (!reviewId) {
    return badRequest('Review ID is required');
  }
  
  if (!masterId) {
    return badRequest('Master ID is required');
  }
  
  logger.info('Get review request', { reviewId, masterId });
  
  const reviewRepo = new ReviewRepository();
  const userRepo = new UserRepository();
  const orderRepo = new OrderRepository();
  
  const review = await reviewRepo.findById(masterId, reviewId);
  
  if (!review) {
    return notFound('Review not found');
  }
  
  const [client, master, order] = await Promise.all([
    userRepo.findById(review.clientId),
    userRepo.findById(masterId),
    orderRepo.findById(review.orderId)
  ]);
  
  const response = {
    id: review.id,
    client: review.isAnonymous ? null : client ? {
      id: client.id,
      name: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
      avatar: client.avatar
    } : null,
    clientName: review.isAnonymous ? 'Anonymous' : client ? 
      `${client.firstName || ''} ${client.lastName || ''}`.trim() : 'Unknown',
    clientAvatar: review.isAnonymous ? null : client?.avatar,
    master: master ? {
      id: master.id,
      name: `${master.firstName || ''} ${master.lastName || ''}`.trim(),
      avatar: master.avatar
    } : null,
    masterName: master ? `${master.firstName || ''} ${master.lastName || ''}`.trim() : 'Unknown',
    masterAvatar: master?.avatar,
    order: order ? {
      id: order.id,
      title: order.title
    } : null,
    orderId: review.orderId,
    orderTitle: order?.title,
    rating: review.rating,
    comment: review.comment,
    response: review.response,
    isAnonymous: review.isAnonymous,
    isVerified: review.isVerified,
    helpfulCount: review.helpfulCount,
    tags: review.tags,
    images: review.images,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    respondedAt: review.responseAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withAuth(getReviewHandler));
