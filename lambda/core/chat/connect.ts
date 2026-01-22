// WebSocket connection handler

import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getRedisClient } from '@/shared/cache/client';
import { getPrismaClient } from '@/shared/db/client';
import { logger } from '@/shared/utils/logger';

export async function handler(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  const userId = event.requestContext.authorizer?.userId;
  
  if (!userId) {
    logger.error('Missing userId in authorizer context');
    return { statusCode: 401 };
  }
  
  logger.info('WebSocket connection', { connectionId, userId });
  
  try {
    const redis = await getRedisClient();
    const prisma = getPrismaClient();
    
    // Store connection ID in Redis
    await redis.set(`ws:connection:${connectionId}`, userId, { EX: 7200 }); // 2 hours
    await redis.sAdd(`ws:user:${userId}`, connectionId);
    
    // Update user online status
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });
    
    logger.info('WebSocket connected', { connectionId, userId });
    
    return { statusCode: 200 };
  } catch (error) {
    logger.error('WebSocket connection failed', error, { connectionId, userId });
    return { statusCode: 500 };
  }
}
