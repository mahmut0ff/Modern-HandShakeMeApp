// Mark all notifications as read Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function markAllReadHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Mark all notifications read', { userId });
  
  const prisma = getPrismaClient();
  
  // Mark all unread notifications as read
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
  
  logger.info('All notifications marked as read', { userId, count: result.count });
  
  return success({
    message: 'All notifications marked as read',
    count: result.count
  });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(markAllReadHandler)));
