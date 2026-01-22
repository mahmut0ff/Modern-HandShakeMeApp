// Delete notification Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
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
  
  const prisma = getPrismaClient();
  
  // Get notification
  const notification = await prisma.notification.findUnique({
    where: { id: parseInt(notificationId) }
  });
  
  if (!notification) {
    return notFound('Notification not found');
  }
  
  // Verify ownership
  if (notification.userId !== userId) {
    return forbidden('You can only delete your own notifications');
  }
  
  // Delete notification
  await prisma.notification.delete({
    where: { id: parseInt(notificationId) }
  });
  
  logger.info('Notification deleted', { notificationId });
  
  return success({ message: 'Notification deleted successfully' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(deleteNotificationHandler)));
