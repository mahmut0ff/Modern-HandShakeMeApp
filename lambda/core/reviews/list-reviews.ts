// List reviews Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { paginated, badRequest } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  masterId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isVerified: z.enum(['true', 'false']).optional(),
});

async function listReviewsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const masterId = event.pathParameters?.masterId;
  
  logger.info('List reviews request', { userId, masterId });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, rating, isVerified } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {};
  
  if (masterId) {
    where.master = {
      userId: masterId
    };
  }
  
  if (rating) {
    where.rating = rating;
  }
  
  if (isVerified !== undefined) {
    where.isVerified = isVerified === 'true';
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
      },
      project: {
        select: {
          id: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  logger.info('Reviews retrieved', { count: reviews.length });
  
  // Format reviews
  const formattedReviews = reviews.map(review => ({
    id: review.id,
    client: review.isAnonymous ? null : {
      id: review.client.user.id,
      name: `${review.client.user.firstName} ${review.client.user.lastName}`,
      avatar: review.client.user.avatar
    },
    clientName: review.isAnonymous ? 'Anonymous' : `${review.client.user.firstName} ${review.client.user.lastName}`,
    clientAvatar: review.isAnonymous ? null : review.client.user.avatar,
    master: {
      id: review.master.user.id,
      name: `${review.master.user.firstName} ${review.master.user.lastName}`,
      avatar: review.master.user.avatar
    },
    masterName: `${review.master.user.firstName} ${review.master.user.lastName}`,
    masterAvatar: review.master.user.avatar,
    order: {
      id: review.order.id,
      title: review.order.title
    },
    orderId: review.orderId,
    orderTitle: review.order.title,
    project: review.project ? {
      id: review.project.id
    } : null,
    projectId: review.projectId,
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

export const handler = withErrorHandler(withRequestTransform(withAuth(listReviewsHandler)));
