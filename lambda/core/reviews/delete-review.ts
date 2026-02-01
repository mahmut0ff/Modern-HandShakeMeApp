import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { success, error, forbidden, notFound, badRequest, unauthorized } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { getCacheInvalidator } from '../shared/utils/cache-invalidation';

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
    
    if (decoded.role !== 'CLIENT') {
      return forbidden('Only clients can delete reviews');
    }
    
    const reviewRepo = new ReviewRepository();
    const masterProfileRepo = new MasterProfileRepository();
    
    // Get reviews by client to find the specific review
    const clientReviewsResult = await reviewRepo.findByClient(decoded.userId);
    const clientReviews = clientReviewsResult.items;
    const review = clientReviews.find(r => r.id === reviewId);
    
    if (!review) {
      return notFound('Review not found or you do not have permission to delete it');
    }
    
    const masterId = review.masterId;
    
    // Delete review
    await reviewRepo.delete(masterId, reviewId);
    
    // Recalculate master rating
    const masterReviewsResult = await reviewRepo.findByMaster(masterId, { limit: 1000 });
    const masterReviews = masterReviewsResult.items;
    
    if (masterReviews.length > 0) {
      const avgRating = masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length;
      
      await masterProfileRepo.updateRating(masterId, avgRating, masterReviews.length);
    } else {
      await masterProfileRepo.updateRating(masterId, 0, 0);
    }
    
    // Invalidate cache
    const cacheInvalidator = getCacheInvalidator();
    await cacheInvalidator.invalidateReviewCache(masterId);
    
    console.log(`Review deleted successfully: ${reviewId} for master: ${masterId}`);
    
    return success({ message: 'Review deleted successfully' });
    
  } catch (err) {
    console.error('Delete review error:', err);
    return error('Failed to delete review', 500);
  }
}
