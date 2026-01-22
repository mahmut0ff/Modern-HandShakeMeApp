// Delete push notification token

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
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
  
  const prisma = getPrismaClient();
  
  const deleted = await prisma.pushToken.deleteMany({
    where: {
      userId,
      platform: data.platform,
    },
  });
  
  if (deleted.count === 0) {
    return notFound('Push token not found');
  }
  
  return success({ message: 'Push token deleted successfully' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(deletePushTokenHandler)));
