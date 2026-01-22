// Get my reviews Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { paginated } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  role: z.enum(['client', 'master']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  hasResponse: z.enum(['true', 'false']).optional(),
});

async function getMyReviewsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('Get my reviews', { userId, userRole });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, role, rating, hasResponse } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause based on role
  const where: any = {};
  
  const viewRole = role || (userRole === 'MASTER' ? 'master' : 'client');
  
  if (viewRole === 'master') {
    const masterProfile = await prisma.masterProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    
    if (!masterProfile) {
      return paginated([], 0, page, page_size);
    }
    
    where.masterId = masterProfile.id;
  } else {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    
    if (!clientProfile) {
      return paginated([], 0, page, page_size);
    }
    
    where.clientId = clientProfile.id;
  }
  
  if (rating) {
    where.rating = rating;
  }
  
  if (hasResponse !== undefined) {
    if (hasResponse === 'true') {
      where.response = { not: null };
    } else {
      where.response = null;
    }
  }
  
  // Get total count
  const total = await prisma.review.count({ where });
  
  // Get reviews
  const reviews = await prisma.review.findMany({
    where,
    skip: (page - 1) * page_size,
    take: page_size,
    include: {
      client: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      },
      master: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      },
      order: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  logger.info('My reviews retrieved', { count: reviews.length });
  
  // Format reviews
  const formattedReviews = reviews.map(review => ({
    id: review.id,
    client: review.isAnonymous ? null : {
      id: review.client.user.id,
      name: `${review.client.user.firstName} ${review.client.user.lastName}`,
      avatar: review.client.user.avatar
    },
    master: {
      id: review.master.user.id,
      name: `${review.master.user.firstName} ${review.master.user.lastName}`,
      avatar: review.master.user.avatar
    },
    order: {
      id: review.order.id,
      title: review.order.title
    },
    rating: review.rating,
    comment: review.comment,
    response: review.response,
    isAnonymous: review.isAnonymous,
    isVerified: review.isVerified,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    respondedAt: review.respondedAt
  }));
  
  return paginated(formattedReviews, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getMyReviewsHandler)));
