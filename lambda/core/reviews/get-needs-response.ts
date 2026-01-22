// Get reviews that need response

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getReviewsNeedingResponseHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get reviews needing response request', { userId });
  
  const prisma = getPrismaClient();
  
  // Get reviews where user is the recipient and hasn't responded
  const reviews = await prisma.review.findMany({
    where: {
      toUserId: userId,
      response: null,
    },
    include: {
      fromUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return success(reviews);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getReviewsNeedingResponseHandler)));
