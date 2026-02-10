// List notifications with DynamoDB

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
        headers: Object.keys(event.headers),
        path: event.path
      });
      return unauthorized('Authorization token required');
    }

    const decoded = verifyJWT(token);
    const userId = decoded.userId;
    
    logger.info('List notifications request', { userId });
    
    const notificationRepo = new NotificationRepository();
    const notifications = await notificationRepo.findByUser(userId);

    logger.info('Notifications listed successfully', { 
      userId, 
      count: notifications.length 
    });

    return success({
      notifications,
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length,
    });
  } catch (error: any) {
    logger.error('List notifications error:', { error: error.message });
    return serverError('Failed to list notifications');
  }
}
