// Get unread notifications count Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getUnreadCountHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get unread count', { userId });
  
  const prisma = getPrismaClient();
  
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
  
  logger.info('Unread count retrieved', { userId, count });
  
  return success({ count });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getUnreadCountHandler)));
