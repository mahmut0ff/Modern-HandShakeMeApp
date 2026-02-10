// Mark notification as read with DynamoDB

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, unauthorized, badRequest, notFound, serverError } from '@/shared/utils/response';
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
    const notificationId = event.pathParameters?.id;

    if (!notificationId) {
      return badRequest('Notification ID required');
    }

    logger.info('Mark notification as read request', { userId, notificationId });

    const notificationRepo = new NotificationRepository();
    
    try {
      const updated = await notificationRepo.update(userId, notificationId, {
        isRead: true,
      });

      logger.info('Notification marked as read', { userId, notificationId });

      return success(updated);
    } catch (error) {
      logger.error('Failed to mark notification as read', { userId, notificationId, error });
      return notFound('Notification not found');
    }
  } catch (error: any) {
    logger.error('Mark notification read error:', { error: error.message });
    return serverError('Failed to mark notification as read');
  }
}
