// WebSocket disconnection handler

import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getRedisClient } from '@/shared/cache/client';
import { getPrismaClient } from '@/shared/db/client';
import { logger } from '@/shared/utils/logger';

export async function handler(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  
  logger.info('WebSocket disconnection', { connectionId });
  
  try {
    const redis = await getRedisClient();
    
    // Get userId from connection
    const userId = await redis.get(`ws:connection:${connectionId}`);
    
    if (!userId) {
      logger.warn('Connection not found in Redis', { connectionId });
      return { statusCode: 200 };
    }
    
    // Remove connection from Redis
    await redis.del(`ws:connection:${connectionId}`);
    await redis.sRem(`ws:user:${userId}`, connectionId);
    
    // Check if user has other connections
    const userConnections = await redis.sMembers(`ws:user:${userId}`);
    
    // If no more connections, update user offline status
    if (userConnections.length === 0) {
      const prisma = getPrismaClient();
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isOnline: false,
          lastSeenAt: new Date(),
        },
      });
    }
    
    logger.info('WebSocket disconnected', { connectionId, userId });
    
    return { statusCode: 200 };
  } catch (error) {
    logger.error('WebSocket disconnection failed', error, { connectionId });
    return { statusCode: 500 };
  }
}
