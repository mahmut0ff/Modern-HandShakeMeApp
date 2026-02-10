// Mark all notifications as read with DynamoDB

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, unauthorized, serverError } from '@/shared/utils/response';
import { logger } from '@/shared/utils/logger';
import { verifyJWT } from '@/shared/utils/jwt';
import { extractAuthToken } from '@/shared/utils/auth-header';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = extractAuthToken(event);
    
    if (!token) {
      logger.warn('No authorization token found', { 
        headers: Object.keys(event.headers) 
      });
      return unauthorized('Authorization token required');
    }

    const decoded = verifyJWT(token);
    const userId = decoded.userId;
    
    logger.info('Mark all notifications as read request', { userId });
    
    const notificationRepo = new NotificationRepository();
    const updatedCount = await notificationRepo.markAllAsRead(userId);

    logger.info('All notifications marked as read', { userId, updatedCount });

    return success({ 
      message: 'All notifications marked as read',
      updatedCount 
    });
  } catch (error: any) {
    logger.error('Mark all read error:', { error: error.message });
    return serverError('Failed to mark notifications as read');
  }
}
