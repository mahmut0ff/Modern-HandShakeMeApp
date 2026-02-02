// Send message in chat room

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'VOICE']).default('TEXT'),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
  replyToId: z.string().uuid().optional(),
});

async function sendMessageHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const data = sendMessageSchema.parse(body);

    const chatRepo = new ChatRepository();
    const room = await chatRepo.findRoomById(data.roomId);

    if (!room) {
      return notFound('Room not found');
    }

    if (!room.participants.includes(userId)) {
      return forbidden('You are not a participant in this room');
    }

    const message = await chatRepo.createMessage({
      roomId: data.roomId,
      senderId: userId,
      content: data.content,
      type: data.type,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      replyToId: data.replyToId,
    });

    // Update room last message
    await chatRepo.updateRoom(data.roomId, {
      lastMessageAt: message.createdAt,
      lastMessage: data.content,
    });

    logger.info('Message sent', { messageId: message.id, roomId: data.roomId, userId });
    return success(message, 201);
  } catch (error: any) {
    logger.error('Send message error', error);
    
    if (error.name === 'ZodError') {
      return badRequest('Invalid message data');
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(sendMessageHandler));
