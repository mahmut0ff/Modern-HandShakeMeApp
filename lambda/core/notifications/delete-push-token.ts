// Delete push notification token with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const deletePushTokenSchema = z.object({
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
});

async function deletePushTokenHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Delete push token request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(deletePushTokenSchema, body);
  
  const notificationRepo = new NotificationRepository();
  
  try {
    await notificationRepo.deletePushToken(userId, data.platform);
    
    logger.info('Push token deleted successfully', { userId, platform: data.platform });
    
    return success({ message: 'Push token deleted successfully' });
  } catch (error) {
    logger.warn('Push token not found or already deleted', { userId, platform: data.platform });
    return notFound('Push token not found');
  }
}

export const handler = withErrorHandler(withRequestTransform(withAuth(deletePushTokenHandler)));
