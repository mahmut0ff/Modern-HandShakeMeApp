// Send typing indicator

import type { APIGatewayProxyResult } from 'aws-lambda';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { success, forbidden, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const chatRepository = new ChatRepository();

async function typingIndicatorHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const roomId = event.pathParameters?.id;
  
  if (!roomId) {
    return notFound('Room ID is required');
  }
  
  logger.info('Typing indicator request', { userId, roomId });
  
  // Check if user is participant
  const room = await chatRepository.findRoomById(roomId);
  if (!room) {
    return notFound('Room not found');
  }
  
  if (!room.participants.includes(userId)) {
    return forbidden('You are not a participant in this chat room');
  }
  
  // Note: In a real implementation, this would:
  // 1. Store typing status temporarily (Redis with TTL)
  // 2. Broadcast typing indicator to other room participants via WebSocket
  // For now, we'll just log and return success
  
  logger.info('Typing indicator processed', { userId, roomId });
  
  return success({ message: 'Typing indicator sent' });
}

export const handler = withErrorHandler(withAuth(typingIndicatorHandler));
