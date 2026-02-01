// List chat rooms for user

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

async function listRoomsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const chatRepository = new ChatRepository();
    const rooms = await chatRepository.findRoomsByUser(userId);

    const response = {
      data: rooms,
      pagination: {
        page: 1,
        limit: rooms.length,
        total: rooms.length,
        totalPages: 1,
      },
    };

    logger.info('Rooms listed', { userId, count: rooms.length });
    return success(response);
  } catch (error) {
    logger.error('List rooms error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(listRoomsHandler));
