// Get unread count with DynamoDB

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, unauthorized, serverError } from '@/shared/utils/response';
import { logger } from '@/shared/utils/logger';
import { verifyJWT } from '@/shared/utils/jwt';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return unauthorized('Authorization required');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyJWT(token);
    const userId = decoded.userId;

    logger.info('Get unread count request', { userId });

    const notificationRepository = new NotificationRepository();
    const notifications = await notificationRepository.findByUser(userId);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    logger.info('Unread count retrieved', { userId, unreadCount });

    return success({ count: unreadCount });
  } catch (error: any) {
    logger.error('Get unread count error:', { error: error.message });
    return serverError('Failed to get unread count');
  }
};
