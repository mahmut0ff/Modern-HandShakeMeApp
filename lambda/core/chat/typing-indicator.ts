// Send typing indicator

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { getRedisClient } from '@/shared/cache/client';
import { success, forbidden, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function typingIndicatorHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const roomId = event.pathParameters?.id;
  
  if (!roomId) {
    return notFound('Room ID is required');
  }
  
  logger.info('Typing indicator request', { userId, roomId });
  
  const prisma = getPrismaClient();
  
  // Check if user is participant
  const participant = await prisma.chatRoomParticipant.findFirst({
    where: {
      roomId,
      userId,
    },
  });
  
  if (!participant) {
    return forbidden('You are not a participant in this chat room');
  }
  
  // Store typing status in Redis with 5 second expiry
  const redis = await getRedisClient();
  const key = `typing:${roomId}:${userId}`;
  await redis.setEx(key, 5, '1');
  
  return success({ message: 'Typing indicator sent' });
}

export const handler = withErrorHandler(withAuth(typingIndicatorHandler));
