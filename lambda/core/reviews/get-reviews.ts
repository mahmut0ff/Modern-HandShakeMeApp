// Get reviews for a master

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { cache } from '@/shared/cache/client';
import { success, notFound } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  minRating: z.coerce.number().int().min(1).max(5).optional(),
});

async function getReviewsHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const masterId = event.pathParameters?.masterId;
  
  if (!masterId) {
    return notFound('Master ID is required');
  }
  
  logger.info('Get reviews', { masterId });
  
  // Parse query parameters
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return success({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  }
  
  const { page, limit, sortBy, sortOrder, minRating } = result.data;
  
  // Generate cache key
  const cacheKey = `reviews:${masterId}:${JSON.stringify({ page, limit, minRating })}`;
  
  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.info('Reviews from cache', { masterId });
    return success(cached);
  }
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {
    masterId,
    ...(minRating && { rating: { gte: minRating } }),
  };
  
  // Get total count
  const total = await prisma.review.count({ where });
  
  // Get reviews
  const reviews = await prisma.review.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
    include: {
      reviewer: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      project: {
        select: {
          id: true,
          order: {
            select: {
              title: true,
            },
          },
        },
      },
      reply: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });
  
  const response = {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  
  // Cache for 5 minutes
  await cache.set(cacheKey, response, 300);
  
  return success(response);
}

export const handler = withErrorHandler(getReviewsHandler);
