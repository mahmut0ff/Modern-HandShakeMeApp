import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { success, error, notFound, badRequest, unauthorized } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';

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
    
    // Get masterId from path parameters
    const masterId = event.pathParameters?.masterId;
    
    if (!masterId) {
      return badRequest('Master ID is required');
    }
    
    const review = await reviewRepo.findById(masterId, reviewId);
    
    if (!review) {
      return notFound('Review not found');
    }
    
    // Check if already marked helpful
    const isAlreadyHelpful = await reviewRepo.isMarkedHelpful(reviewId, decoded.userId);
    
    if (isAlreadyHelpful) {
      // Remove helpful mark
      await reviewRepo.unmarkHelpful(reviewId, decoded.userId);
      await reviewRepo.decrementHelpfulCount(masterId, reviewId);
      
      return success({ message: 'Helpful mark removed', isHelpful: false });
    } else {
      // Add helpful mark
      await reviewRepo.markHelpful(reviewId, decoded.userId);
      await reviewRepo.incrementHelpfulCount(masterId, reviewId);
      
      return success({ message: 'Review marked as helpful', isHelpful: true });
    }
    
  } catch (err) {
    console.error('Mark helpful error:', err);
    return error('Failed to mark review as helpful', 500);
  }
}
