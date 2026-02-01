import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { success, error, notFound, badRequest, unauthorized } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { OrderRepository } from '../shared/repositories/order.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Get token from header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return unauthorized('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return unauthorized('Invalid or expired token');
    }

    const reviewId = event.pathParameters?.id;
    
    if (!reviewId) {
      return badRequest('Review ID is required');
    }
    
    const reviewRepo = new ReviewRepository();
    const userRepo = new UserRepository();
    const orderRepo = new OrderRepository();
    
    // Try to find review by querying through order GSI
    const masterId = event.pathParameters?.masterId;
    
    if (!masterId) {
      return badRequest('Master ID is required');
    }
    
    const review = await reviewRepo.findById(masterId, reviewId);
    
    if (!review) {
      return notFound('Review not found');
    }
    
    // Get related data
    const [client, master, order] = await Promise.all([
      userRepo.findById(review.clientId),
      userRepo.findById(masterId),
      orderRepo.findById(review.orderId)
    ]);
    
    // Format response
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
    
  } catch (err) {
    console.error('Get review error:', err);
    return error('Failed to get review', 500);
  }
}
