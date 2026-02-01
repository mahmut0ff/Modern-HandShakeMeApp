import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { success, error, unauthorized } from '../shared/utils/response';
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
    
    const reviewRepo = new ReviewRepository();
    const userRepo = new UserRepository();
    const orderRepo = new OrderRepository();
    
    // Get reviews that need response for this master
    const reviews = await reviewRepo.getReviewsNeedingResponse(decoded.userId);
    
    // Enrich with client and order data
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
    
    return success(enrichedReviews);
    
  } catch (err) {
    console.error('Get reviews needing response error:', err);
    return error('Failed to get reviews needing response', 500);
  }
}
