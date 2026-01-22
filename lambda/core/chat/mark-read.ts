// Mark message as read Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function markReadHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const messageId = event.pathParameters?.messageId;
  
  if (!messageId) {
    return badRequest('Message ID is required');
  }
  
  logger.info('Mark message read', { userId, messageId });
  
  const prisma = getPrismaClient();
  
  // Get message
  const message = await prisma.message.findUnique({
    where: { id: parseInt(messageId) },
    include: {
      room: {
        include: {
          participants: {
            where: { userId }
          }
        }
      }
    }
  });
  
  if (!message) {
    return notFound('Message not found');
  }
  
  // Verify user is participant
  if (message.room.participants.length === 0) {
    return forbidden('You are not a participant in this room');
  }
  
  // Mark message as read
  const updated = await prisma.message.update({
    where: { id: parseInt(messageId) },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
  
  // Decrement unread count for this user
  await prisma.chatParticipant.updateMany({
    where: {
      roomId: message.roomId,
      userId,
      unreadCount: { gt: 0 }
    },
    data: {
      unreadCount: { decrement: 1 }
    }
  });
  
  logger.info('Message marked as read', { messageId });
  
  return success({ message: 'Message marked as read' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(markReadHandler)));
