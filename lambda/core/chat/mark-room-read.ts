// Mark room as read

import type { APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

async function markRoomReadHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const roomId = event.pathParameters?.roomId;
  
  if (!roomId) {
    return badRequest('Room ID is required');
  }
  
  logger.info('Mark room read', { userId, roomId });
  
  const chatRepository = new ChatRepository();
  
  // Verify room exists and user is participant
  const room = await chatRepository.findRoomById(roomId);
  if (!room) {
    return notFound('Chat room not found');
  }
  
  if (!room.participants.includes(userId)) {
    return forbidden('You are not a participant in this room');
  }
  
  // Mark room as read for this user
  await chatRepository.markRoomRead(roomId, userId);
  
  logger.info('Room marked as read', { roomId, userId });
  return success({ message: 'Room marked as read' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(markRoomReadHandler)));
