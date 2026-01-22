// Delete all notifications for current user

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function deleteAllNotificationsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Delete all notifications request', { userId });
  
  const prisma = getPrismaClient();
  
  const result = await prisma.notification.deleteMany({
    where: { userId },
  });
  
  return success({ 
    message: 'All notifications deleted successfully',
    deletedCount: result.count,
  });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(deleteAllNotificationsHandler)));
