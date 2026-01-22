// Mark room as read Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function markRoomReadHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const roomId = event.pathParameters?.roomId;
  
  if (!roomId) {
    return badRequest('Room ID is required');
  }
  
  logger.info('Mark room read', { userId, roomId });
  
  const prisma = getPrismaClient();
  
  // Verify user is participant
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
    include: {
      participants: {
        where: { userId }
      }
    }
  });
  
  if (!room) {
    return notFound('Chat room not found');
  }
  
  if (room.participants.length === 0) {
    return forbidden('You are not a participant in this room');
  }
  
  // Mark all unread messages in room as read
  await prisma.message.updateMany({
    where: {
      roomId: parseInt(roomId),
      senderId: { not: userId },
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
  
  // Reset unread count for this user
  await prisma.chatParticipant.updateMany({
    where: {
      roomId: parseInt(roomId),
      userId
    },
    data: {
      unreadCount: 0
    }
  });
  
  logger.info('Room marked as read', { roomId });
  
  return success({ message: 'Room marked as read' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(markRoomReadHandler)));
