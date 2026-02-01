// Get notifications with DynamoDB

import { APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getNotificationsHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const limit = parseInt(event.queryStringParameters?.limit || '50');
  
  logger.info('Get notifications request', { userId, limit });
  
  const notificationRepo = new NotificationRepository();
  
  // Get user notifications
  const notifications = await notificationRepo.findByUser(userId, limit);
  
  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  logger.info('Notifications retrieved successfully', {
    userId,
    count: notifications.length,
    unreadCount,
  });
  
  return success({
    notifications,
    unreadCount,
    total: notifications.length,
  });
}

export const handler = withErrorHandler(withAuth(getNotificationsHandler));