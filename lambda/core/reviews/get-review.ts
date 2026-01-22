// Get single review Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getReviewHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const reviewId = event.pathParameters?.id;
  
  if (!reviewId) {
    return badRequest('Review ID is required');
  }
  
  logger.info('Get review', { userId, reviewId });
  
  const prisma = getPrismaClient();
  
  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) },
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
    }
  });
  
  if (!review) {
    return notFound('Review not found');
  }
  
  logger.info('Review retrieved', { reviewId });
  
  // Format response
  const response = {
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
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getReviewHandler)));
