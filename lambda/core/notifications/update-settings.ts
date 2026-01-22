// Update notification settings

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validateSafe } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
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
  const result = validateSafe(settingsSchema, body);
  
  if (!result.success) {
    return success({ message: 'Invalid data' });
  }
  
  const data = result.data;
  const prisma = getPrismaClient();
  
  const settings = await prisma.notificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });
  
  return success(settings);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateNotificationSettingsHandler)));
