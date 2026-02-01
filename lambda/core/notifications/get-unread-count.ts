// Get unread count with DynamoDB

import { APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getUnreadCountHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get unread count request', { userId });
  
  const notificationRepo = new NotificationRepository();
  
  // Get user notifications and count unread
  const notifications = await notificationRepo.findByUser(userId, 1000);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  logger.info('Unread count retrieved successfully', {
    userId,
    unreadCount,
  });
  
  return success({
    unreadCount,
  });
}

export const handler = withErrorHandler(withAuth(getUnreadCountHandler));