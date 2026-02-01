import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, error, badRequest } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { CacheService } from '../shared/cache/client';

const cache = new CacheService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const masterId = event.pathParameters?.id || event.pathParameters?.masterId;
    
    if (!masterId) {
      return badRequest('Master ID is required');
    }

    // Generate cache key
    const cacheKey = `reviews:stats:${masterId}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return success(cached);
    }

    const reviewRepo = new ReviewRepository();
    const userRepo = new UserRepository();

    // Get statistics using repository method
    const stats = await reviewRepo.getReviewStats(masterId);

    // Get recent reviews (last 5)
    const allReviewsResult = await reviewRepo.findByMaster(masterId, { limit: 100 });
    const recentReviews = allReviewsResult.items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Enrich recent reviews with client data
    const enrichedRecentReviews = await Promise.all(
      recentReviews.map(async (review) => {
        const client = await userRepo.findById(review.clientId);
        
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          clientName: review.isAnonymous ? 'Anonymous' : client ? 
            `${client.firstName || ''} ${client.lastName || ''}`.trim() : 'Unknown',
          clientAvatar: review.isAnonymous ? null : client?.avatar,
          isAnonymous: review.isAnonymous,
          isVerified: review.isVerified,
          createdAt: review.createdAt
        };
      })
    );

    const response = {
      totalReviews: stats.totalReviews,
      averageRating: stats.averageRating,
      ratingDistribution: stats.ratingDistribution,
      verifiedReviews: stats.verifiedReviews,
      needsResponse: stats.needsResponse,
      recentReviews: enrichedRecentReviews
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);

    return success(response);
    
  } catch (err) {
    console.error('Get review stats error:', err);
    return error('Failed to get review statistics', 500);
  }
};
