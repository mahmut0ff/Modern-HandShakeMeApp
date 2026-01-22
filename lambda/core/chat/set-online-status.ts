// Set user online status

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { getRedisClient } from '@/shared/cache/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const onlineStatusSchema = z.object({
  isOnline: z.boolean(),
});

async function setOnlineStatusHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Set online status request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(onlineStatusSchema, body);
  
  const prisma = getPrismaClient();
  
  // Update user online status
  await prisma.user.update({
    where: { id: userId },
    data: {
      isOnline: data.isOnline,
      lastSeen: new Date(),
    },
  });
  
  // Store in Redis for fast access
  const redis = await getRedisClient();
  const key = `online:${userId}`;
  
  if (data.isOnline) {
    await redis.setEx(key, 300, '1'); // 5 minutes
  } else {
    await redis.del(key);
  }
  
  return success({ message: 'Online status updated', isOnline: data.isOnline });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(setOnlineStatusHandler)));
