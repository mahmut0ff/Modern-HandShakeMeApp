// Mark notification as read Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function markReadHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const notificationId = event.pathParameters?.id;
  
  if (!notificationId) {
    return badRequest('Notification ID is required');
  }
  
  logger.info('Mark notification read', { userId, notificationId });
  
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
    return forbidden('You can only mark your own notifications as read');
  }
  
  // Mark as read
  const updated = await prisma.notification.update({
    where: { id: parseInt(notificationId) },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
  
  logger.info('Notification marked as read', { notificationId });
  
  const response = {
    id: updated.id,
    user: updated.userId,
    title: updated.title,
    message: updated.message,
    notificationType: updated.notificationType,
    relatedObjectType: updated.relatedObjectType,
    relatedObjectId: updated.relatedObjectId,
    data: updated.data,
    isRead: updated.isRead,
    isSent: updated.isSent,
    priority: updated.priority,
    createdAt: updated.createdAt,
    readAt: updated.readAt,
    sentAt: updated.sentAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(markReadHandler)));
