// Mark notification as read with DynamoDB

import { APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, badRequest, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function markNotificationReadHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const notificationId = event.pathParameters?.id;
  
  if (!notificationId) {
    return badRequest('Notification ID is required');
  }
  
  logger.info('Mark notification read request', { userId, notificationId });
  
  const notificationRepo = new NotificationRepository();
  
  try {
    // Mark notification as read
    const updatedNotification = await notificationRepo.update(userId, notificationId, { 
      isRead: true 
    });
    
    logger.info('Notification marked as read successfully', {
      userId,
      notificationId,
    });
    
    return success({
      message: 'Notification marked as read',
      notification: updatedNotification,
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', error);
    return notFound('Notification not found');
  }
}

export const handler = withErrorHandler(withAuth(markNotificationReadHandler));