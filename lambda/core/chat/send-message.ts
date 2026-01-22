// Send chat message Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, notFound, forbidden } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const sendMessageSchema = z.object({
  room: z.number().int().positive(),
  messageType: z.enum(['text', 'image', 'file']),
  content: z.string().max(5000).optional(),
  replyTo: z.number().int().positive().optional()
});

async function sendMessageHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Send message', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(sendMessageSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  // Verify user is participant
  const room = await prisma.chatRoom.findUnique({
    where: { id: data.room },
    include: {
      participants: true
    }
  });
  
  if (!room) {
    return notFound('Chat room not found');
  }
  
  const isParticipant = room.participants.some(p => p.userId === userId);
  if (!isParticipant) {
    return forbidden('You are not a participant in this room');
  }
  
  // Verify reply-to message if specified
  if (data.replyTo) {
    const replyToMessage = await prisma.message.findUnique({
      where: { id: data.replyTo }
    });
    
    if (!replyToMessage || replyToMessage.roomId !== data.room) {
      return badRequest('Reply-to message not found in this room');
    }
  }
  
  // Create message
  const message = await prisma.message.create({
    data: {
      roomId: data.room,
      senderId: userId,
      messageType: data.messageType.toUpperCase(),
      content: data.content,
      replyToId: data.replyTo,
      isRead: false,
      isEdited: false
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true
        }
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true
        }
      }
    }
  });
  
  // Update room
  await prisma.chatRoom.update({
    where: { id: data.room },
    data: {
      updatedAt: new Date()
    }
  });
  
  // Increment unread count for other participants
  await prisma.chatParticipant.updateMany({
    where: {
      roomId: data.room,
      userId: { not: userId }
    },
    data: {
      unreadCount: { increment: 1 }
    }
  });
  
  logger.info('Message sent', { messageId: message.id, roomId: data.room });
  
  // Format response
  const response = {
    id: message.id,
    room: message.roomId,
    sender: {
      id: message.sender.id,
      firstName: message.sender.firstName,
      lastName: message.sender.lastName,
      fullName: `${message.sender.firstName} ${message.sender.lastName}`,
      avatar: message.sender.avatar,
      role: message.sender.role
    },
    messageType: message.messageType,
    content: message.content,
    isRead: message.isRead,
    isEdited: message.isEdited,
    replyTo: message.replyToId,
    replyToMessage: message.replyTo,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
  
  return success(response, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(sendMessageHandler)));
