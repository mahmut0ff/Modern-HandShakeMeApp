import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { success, error, forbidden, notFound, badRequest, unauthorized } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { getCacheInvalidator } from '../shared/utils/cache-invalidation';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const updateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be at most 1000 characters').trim().optional(),
  isAnonymous: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images allowed').optional(),
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

    const reviewId = event.pathParameters?.id;
    if (!reviewId) {
      return badRequest('Review ID is required');
    }

    if (decoded.role !== 'CLIENT') {
      return forbidden('Only clients can update reviews');
    }

    const body = JSON.parse(event.body || '{}');
    const data = updateReviewSchema.parse(body);

    const reviewRepo = new ReviewRepository();
    const masterProfileRepo = new MasterProfileRepository();
    
    // Get reviews by client to find the specific review
    const clientReviewsResult = await reviewRepo.findByClient(decoded.userId);
    const clientReviews = clientReviewsResult.items;
    const review = clientReviews.find(r => r.id === reviewId);
    
    if (!review) {
      return notFound('Review not found or you do not have permission to update it');
    }
    
    const masterId = review.masterId;

    const updatedReview = await reviewRepo.update(masterId, reviewId, {
      rating: data.rating,
      comment: data.comment,
      isAnonymous: data.isAnonymous,
      tags: data.tags,
      images: data.images,
    });

    // Recalculate master rating if rating was updated
    if (data.rating !== undefined) {
      const masterReviewsResult = await reviewRepo.findByMaster(masterId, { limit: 1000 });
      const masterReviews = masterReviewsResult.items;
      const avgRating = masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length;
      await masterProfileRepo.updateRating(masterId, avgRating, masterReviews.length);
    }
    
    // Invalidate cache
    const cacheInvalidator = getCacheInvalidator();
    await cacheInvalidator.invalidateReviewCache(masterId);
    
    console.log(`Review updated successfully: ${reviewId} for master: ${masterId}`);

    return success(updatedReview);
    
  } catch (err) {
    console.error('Update review error:', err);
    
    if (err instanceof z.ZodError) {
      return error('Validation error: ' + err.errors[0].message, 400);
    }
    
    return error('Failed to update review', 500);
  }
}
