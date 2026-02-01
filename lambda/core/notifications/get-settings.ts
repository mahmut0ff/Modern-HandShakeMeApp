// Get notification settings with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getNotificationSettingsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get notification settings request', { userId });
  
  const notificationRepo = new NotificationRepository();
  
  let settings = await notificationRepo.getNotificationSettings(userId);
  
  // Create default settings if not exist
  if (!settings) {
    settings = await notificationRepo.createDefaultNotificationSettings(userId);
    logger.info('Created default notification settings', { userId });
  }
  
  return success(settings);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getNotificationSettingsHandler)));
