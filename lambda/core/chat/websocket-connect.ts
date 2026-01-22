// WebSocket connect handler

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function websocketConnectHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.userId;
  
  if (!connectionId) {
    logger.error('No connection ID provided');
    return { statusCode: 400, body: 'Bad Request' };
  }
  
  logger.info('WebSocket connection request', { connectionId, userId });
  
  if (!userId) {
    logger.warn('No user ID provided for WebSocket connection');
    return success({ message: 'Connected' });
  }
  
  const prisma = getPrismaClient();
  
  try {
    // Store connection
    await prisma.webSocketConnection.create({
      data: {
        connectionId,
        userId,
        connectedAt: new Date(),
      },
    });
    
    // Update user online status
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isOnline: true,
        lastSeen: new Date(),
      },
    });
    
    logger.info('WebSocket connection established', { connectionId, userId });
    
    return success({ message: 'Connected' });
  } catch (error) {
    logger.error('WebSocket connection failed', { connectionId, userId, error });
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

export const handler = withErrorHandler(websocketConnectHandler);
