// Register push notification token

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  deviceId: z.string().optional(),
});

async function registerPushTokenHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Register push token request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(pushTokenSchema, body);
  
  const prisma = getPrismaClient();
  
  // Upsert push token
  const pushToken = await prisma.pushToken.upsert({
    where: {
      userId_platform: {
        userId,
        platform: data.platform,
      },
    },
    create: {
      userId,
      token: data.token,
      platform: data.platform,
      deviceId: data.deviceId,
    },
    update: {
      token: data.token,
      deviceId: data.deviceId,
      updatedAt: new Date(),
    },
  });
  
  return success(pushToken, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(registerPushTokenHandler)));
