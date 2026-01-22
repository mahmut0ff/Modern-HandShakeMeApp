// Respond to review Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const respondSchema = z.object({
  response: z.string().min(1).max(1000)
});

async function respondToReviewHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const reviewId = event.pathParameters?.id;
  
  if (!reviewId) {
    return badRequest('Review ID is required');
  }
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can respond to reviews');
  }
  
  logger.info('Respond to review', { userId, reviewId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(respondSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  // Get master profile
  const masterProfile = await prisma.masterProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (!masterProfile) {
    return notFound('Master profile not found');
  }
  
  // Get review
  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) }
  });
  
  if (!review) {
    return notFound('Review not found');
  }
  
  // Verify review is for this master
  if (review.masterId !== masterProfile.id) {
    return forbidden('You can only respond to reviews about you');
  }
  
  // Update review with response
  const updated = await prisma.review.update({
    where: { id: parseInt(reviewId) },
    data: {
      response: data.response,
      respondedAt: new Date()
    },
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
    }
  });
  
  logger.info('Review response added', { reviewId });
  
  // Format response
  const response = {
    id: updated.id,
    client: updated.isAnonymous ? null : {
      id: updated.client.user.id,
      name: `${updated.client.user.firstName} ${updated.client.user.lastName}`,
      avatar: updated.client.user.avatar
    },
    master: {
      id: updated.master.user.id,
      name: `${updated.master.user.firstName} ${updated.master.user.lastName}`,
      avatar: updated.master.user.avatar
    },
    order: {
      id: updated.order.id,
      title: updated.order.title
    },
    rating: updated.rating,
    comment: updated.comment,
    response: updated.response,
    isAnonymous: updated.isAnonymous,
    isVerified: updated.isVerified,
    helpfulCount: updated.helpfulCount,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    respondedAt: updated.respondedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(respondToReviewHandler)));
