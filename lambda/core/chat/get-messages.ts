// Get chat messages Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { paginated, badRequest, notFound, forbidden } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema;

async function getMessagesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const roomId = event.pathParameters?.roomId;
  
  if (!roomId) {
    return badRequest('Room ID is required');
  }
  
  logger.info('Get messages', { userId, roomId });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size } = result.data;
  
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
  
  // Get total count
  const total = await prisma.message.count({
    where: { roomId: parseInt(roomId) }
  });
  
  // Get messages
  const messages = await prisma.message.findMany({
    where: { roomId: parseInt(roomId) },
    skip: (page - 1) * page_size,
    take: page_size,
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  logger.info('Messages retrieved', { count: messages.length });
  
  // Format messages
  const formattedMessages = messages.map(message => ({
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
    senderId: message.senderId,
    senderFirstName: message.sender.firstName,
    senderLastName: message.sender.lastName,
    senderFullName: `${message.sender.firstName} ${message.sender.lastName}`,
    senderAvatar: message.sender.avatar,
    senderRole: message.sender.role,
    messageType: message.messageType,
    content: message.content,
    file: message.file,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    fileSize: message.fileSize,
    image: message.image,
    imageUrl: message.imageUrl,
    thumbnail: message.thumbnail,
    isRead: message.isRead,
    isEdited: message.isEdited,
    replyTo: message.replyToId,
    replyToMessage: message.replyTo ? {
      id: message.replyTo.id,
      content: message.replyTo.content,
      senderId: message.replyTo.senderId
    } : null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    readAt: message.readAt
  }));
  
  return paginated(formattedMessages, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getMessagesHandler)));
