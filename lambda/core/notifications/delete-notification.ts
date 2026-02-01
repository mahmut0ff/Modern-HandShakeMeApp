// Delete notification with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function deleteNotificationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const notificationId = event.pathParameters?.id;
  
  if (!notificationId) {
    return badRequest('Notification ID is required');
  }
  
  logger.info('Delete notification', { userId, notificationId });
  
  const notificationRepo = new NotificationRepository();
  
  // Get user's notifications to verify ownership
  const notifications = await notificationRepo.findByUser(userId, 1000);
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return notFound('Notification not found');
  }
  
  // Delete notification
  await notificationRepo.delete(userId, notificationId);
  
  logger.info('Notification deleted', { notificationId });
  
  return success({ message: 'Notification deleted successfully' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(deleteNotificationHandler)));
