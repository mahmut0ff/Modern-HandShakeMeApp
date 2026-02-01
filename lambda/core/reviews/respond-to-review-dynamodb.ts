import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { success, error, forbidden, notFound, badRequest, unauthorized } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { getCacheInvalidator } from '../shared/utils/cache-invalidation';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const respondSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters').max(1000, 'Response must be at most 1000 characters').trim(),
});

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

    if (decoded.role !== 'MASTER') {
      return forbidden('Only masters can respond to reviews');
    }

    const reviewId = event.pathParameters?.id;

    if (!reviewId) {
      return badRequest('Review ID is required');
    }

    const reviewRepo = new ReviewRepository();
    
    // Find review for this master
    const review = await reviewRepo.findById(decoded.userId, reviewId);

    if (!review) {
      return notFound('Review not found or you do not have permission to respond');
    }

    const body = JSON.parse(event.body || '{}');
    const { response } = respondSchema.parse(body);

    const updated = await reviewRepo.addResponse(decoded.userId, reviewId, response);
    
    // Invalidate cache
    const cacheInvalidator = getCacheInvalidator();
    await cacheInvalidator.invalidateReviewCache(decoded.userId);
    
    console.log(`Response added to review: ${reviewId} by master: ${decoded.userId}`);

    return success(updated);
    
  } catch (err) {
    console.error('Respond to review error:', err);
    
    if (err instanceof z.ZodError) {
      return error('Validation error: ' + err.errors[0].message, 400);
    }
    
    return error('Failed to respond to review', 500);
  }
}
