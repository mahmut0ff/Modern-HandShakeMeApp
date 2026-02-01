// Mark message as read

import type { APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

async function markReadHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const messageId = event.pathParameters?.messageId;
  const roomId = event.pathParameters?.roomId;
  
  if (!messageId || !roomId) {
    return badRequest('Message ID and Room ID are required');
  }
  
  logger.info('Mark message read', { userId, messageId, roomId });
  
  const chatRepository = new ChatRepository();
  
  // Verify room exists and user is participant
  const room = await chatRepository.findRoomById(roomId);
  if (!room) {
    return notFound('Room not found');
  }
  
  if (!room.participants.includes(userId)) {
    return forbidden('You are not a participant in this room');
  }
  
  // Verify message exists
  const message = await chatRepository.findMessageById(roomId, messageId);
  if (!message) {
    return notFound('Message not found');
  }
  
  // Mark message as read
  await chatRepository.markMessageRead(roomId, messageId, userId);
  
  logger.info('Message marked as read', { messageId, roomId, userId });
  return success({ message: 'Message marked as read' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(markReadHandler)));
