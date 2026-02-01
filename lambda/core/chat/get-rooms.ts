// Get chat rooms for current user

import type { APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function getRoomsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  logger.info('Get chat rooms', { userId });
  
  const chatRepository = new ChatRepository();
  const rooms = await chatRepository.findRoomsByUser(userId);
  
  logger.info('Chat rooms retrieved', { userId, count: rooms.length });
  return success(rooms);
}

export const handler = withErrorHandler(withAuth(getRoomsHandler));
