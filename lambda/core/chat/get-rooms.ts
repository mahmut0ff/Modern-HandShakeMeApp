// Get chat rooms for current user

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getRoomsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  logger.info('Get chat rooms', { userId });
  
  const prisma = getPrismaClient();
  
  const rooms = await prisma.chatRoom.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isOnline: true,
              lastSeenAt: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });
  
  return success(rooms);
}

export const handler = withErrorHandler(withAuth(getRoomsHandler));
