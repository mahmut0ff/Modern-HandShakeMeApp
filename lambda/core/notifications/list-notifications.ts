// List notifications Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { paginated } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  isRead: z.enum(['true', 'false']).optional(),
  notificationType: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

async function listNotificationsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('List notifications', { userId });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, isRead, notificationType, priority } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {
    userId,
  };
  
  if (isRead !== undefined) {
    where.isRead = isRead === 'true';
  }
  
  if (notificationType) {
    where.notificationType = notificationType;
  }
  
  if (priority) {
    where.priority = priority.toUpperCase();
  }
  
  // Get total count
  const total = await prisma.notification.count({ where });
  
  // Get notifications
  const notifications = await prisma.notification.findMany({
    where,
    skip: (page - 1) * page_size,
    take: page_size,
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  logger.info('Notifications retrieved', { count: notifications.length });
  
  // Format notifications
  const formattedNotifications = notifications.map(notification => ({
    id: notification.id,
    user: notification.userId,
    title: notification.title,
    message: notification.message,
    notificationType: notification.notificationType,
    relatedObjectType: notification.relatedObjectType,
    relatedObjectId: notification.relatedObjectId,
    data: notification.data,
    isRead: notification.isRead,
    isSent: notification.isSent,
    priority: notification.priority,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
    sentAt: notification.sentAt
  }));
  
  return paginated(formattedNotifications, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(listNotificationsHandler)));
