// Send test notification

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function sendTestNotificationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Send test notification request', { userId });
  
  const prisma = getPrismaClient();
  
  // Create test notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: 'Test Notification',
      message: 'This is a test notification to verify your notification settings are working correctly.',
      isRead: false,
    },
  });
  
  return success({ 
    message: 'Test notification sent successfully',
    notification,
  }, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(sendTestNotificationHandler)));
