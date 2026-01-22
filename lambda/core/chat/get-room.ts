// Get chat room Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound, forbidden, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getRoomHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const roomId = event.pathParameters?.id;
  
  if (!roomId) {
    return badRequest('Room ID is required');
  }
  
  logger.info('Get chat room', { userId, roomId });
  
  const prisma = getPrismaClient();
  
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true
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
  
  if (!room) {
    return notFound('Chat room not found');
  }
  
  // Verify user is participant
  const isParticipant = room.participants.some(p => p.userId === userId);
  if (!isParticipant) {
    return forbidden('You are not a participant in this room');
  }
  
  logger.info('Chat room retrieved', { roomId });
  
  // Get unread count for this user
  const participant = room.participants.find(p => p.userId === userId);
  const unreadCount = participant?.unreadCount || 0;
  
  // Format response
  const response = {
    id: room.id,
    participants: room.participants.map(p => ({
      id: p.id,
      user: {
        id: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        fullName: `${p.user.firstName} ${p.user.lastName}`,
        avatar: p.user.avatar,
        role: p.user.role
      },
      isOnline: p.isOnline,
      lastSeen: p.lastSeen,
      joinedAt: p.joinedAt
    })),
    order: room.order ? {
      id: room.order.id,
      title: room.order.title
    } : null,
    project: room.project ? {
      id: room.project.id
    } : null,
    unreadCount,
    isActive: room.isActive,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getRoomHandler)));
