// Get messages from chat room

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

async function getMessagesHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const roomId = event.pathParameters?.roomId;
  if (!roomId) {
    return badRequest('Room ID is required');
  }

  try {
    const chatRepo = new ChatRepository();
    const room = await chatRepo.findRoomById(roomId);

    if (!room) {
      return notFound('Room not found');
    }

    if (!room.participants.includes(userId)) {
      return forbidden('You are not a participant in this room');
    }

    // Get pagination parameters
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const lastMessageId = event.queryStringParameters?.lastMessageId;

    const messages = await chatRepo.findMessages(roomId, limit, lastMessageId);

    logger.info('Messages retrieved', { roomId, userId, count: messages.length });
    return success(messages);
  } catch (error: any) {
    logger.error('Get messages error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(getMessagesHandler));
