// Get chat room details

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

async function getRoomHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const roomId = event.pathParameters?.id;
  if (!roomId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Room ID required' }) };
  }

  try {
    const chatRepository = new ChatRepository();
    const room = await chatRepository.findRoomById(roomId);
    
    if (!room) {
      return notFound('Room not found');
    }
    
    // Verify user is participant
    if (!room.participants.includes(userId)) {
      return forbidden('You are not a participant in this room');
    }

    logger.info('Room retrieved', { roomId, userId });
    return success(room);
  } catch (error) {
    logger.error('Get room error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(getRoomHandler));
