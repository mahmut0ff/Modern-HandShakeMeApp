// WebSocket disconnect handler

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function websocketDisconnectHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId;
  
  if (!connectionId) {
    logger.error('No connection ID provided');
    return { statusCode: 400, body: 'Bad Request' };
  }
  
  logger.info('WebSocket disconnect request', { connectionId });
  
  const prisma = getPrismaClient();
  
  try {
    // Get connection to find user
    const connection = await prisma.webSocketConnection.findUnique({
      where: { connectionId },
    });
    
    if (connection) {
      // Update user online status
      await prisma.user.update({
        where: { id: connection.userId },
        data: { 
          isOnline: false,
          lastSeen: new Date(),
        },
      });
      
      // Delete connection
      await prisma.webSocketConnection.delete({
        where: { connectionId },
      });
      
      logger.info('WebSocket disconnected', { 
        connectionId, 
        userId: connection.userId 
      });
    }
    
    return success({ message: 'Disconnected' });
  } catch (error) {
    logger.error('WebSocket disconnect failed', { connectionId, error });
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

export const handler = withErrorHandler(websocketDisconnectHandler);
