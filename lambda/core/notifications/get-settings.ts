// Get notification settings

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
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
  
  const prisma = getPrismaClient();
  
  let settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });
  
  // Create default settings if not exist
  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: {
        userId,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        newOrders: true,
        newApplications: true,
        applicationAccepted: true,
        applicationRejected: true,
        newMessages: true,
        projectUpdates: true,
        paymentReceived: true,
        reviewReceived: true,
      },
    });
  }
  
  return success(settings);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getNotificationSettingsHandler)));
