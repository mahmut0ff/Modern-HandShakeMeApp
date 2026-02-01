// Update notification settings with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const settingsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  newOrders: z.boolean().optional(),
  newApplications: z.boolean().optional(),
  applicationAccepted: z.boolean().optional(),
  applicationRejected: z.boolean().optional(),
  newMessages: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  paymentReceived: z.boolean().optional(),
  reviewReceived: z.boolean().optional(),
});

async function updateNotificationSettingsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Update notification settings request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(settingsSchema, body);
  
  const notificationRepo = new NotificationRepository();
  
  // Check if settings exist, create if not
  let existingSettings = await notificationRepo.getNotificationSettings(userId);
  if (!existingSettings) {
    existingSettings = await notificationRepo.createDefaultNotificationSettings(userId);
  }
  
  // Update settings
  const settings = await notificationRepo.updateNotificationSettings(userId, data);
  
  logger.info('Notification settings updated', { userId, updatedFields: Object.keys(data) });
  
  return success(settings);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateNotificationSettingsHandler)));
