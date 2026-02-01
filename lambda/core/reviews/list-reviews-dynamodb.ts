import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, error, badRequest } from '../shared/utils/response';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { CacheService } from '../shared/cache/client';

const cache = new CacheService();

const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  rating: z.string().regex(/^\d+$/).transform(Number).optional(),
  verified: z.string().transform(val => val === 'true').optional(),
  lastEvaluatedKey: z.string().optional(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const masterId = event.pathParameters?.masterId;

    if (!masterId) {
      return badRequest('Master ID is required');
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);
    const { limit, rating, verified, lastEvaluatedKey } = validatedQuery;

    // Decode lastEvaluatedKey if provided
    let decodedLastKey: Record<string, any> | undefined;
    if (lastEvaluatedKey) {
      try {
        decodedLastKey = JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString());
      } catch (err) {
        return badRequest('Invalid lastEvaluatedKey');
      }
    }

    // Generate cache key
    const cacheKey = `reviews:list:${masterId}:${JSON.stringify({ limit, rating, verified, lastEvaluatedKey })}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return success(cached);
    }

    const reviewRepo = new ReviewRepository();
    const userRepo = new UserRepository();
    const orderRepo = new OrderRepository();

    // Get reviews for master with proper pagination
    const result = await reviewRepo.findByMaster(masterId, {
      rating,
      isVerified: verified,
      limit,
      lastEvaluatedKey: decodedLastKey,
    });

    // Enrich reviews with user and order data
    const enrichedReviews = await Promise.all(
      result.items.map(async (review) => {
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
          order: order ? {
            id: order.id,
            title: order.title
          } : null,
          tags: review.tags,
          images: review.images
        };
      })
    );

    // Encode lastEvaluatedKey for response
    const encodedLastKey = result.lastEvaluatedKey 
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    const response = {
      data: enrichedReviews,
      pagination: {
        limit,
        hasMore: !!result.lastEvaluatedKey,
        lastEvaluatedKey: encodedLastKey,
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);

    return success(response);
    
  } catch (err) {
    console.error('List reviews error:', err);
    
    if (err instanceof z.ZodError) {
      return error('Validation error: ' + err.errors[0].message, 400);
    }
    
    return error('Failed to list reviews', 500);
  }
}
