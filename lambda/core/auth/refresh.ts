// Token refresh Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import {
  verifyRefreshToken,
  issueAccessToken,
  issueRefreshToken,
  blacklistToken,
} from '@/shared/services/token';
import { success, unauthorized } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function refreshHandler(
  event: any
): Promise<APIGatewayProxyResult> {
  logger.info('Token refresh request received');
  
  // Request is already transformed by withRequestTransform middleware
  const body = JSON.parse(event.body || '{}');
  const { refresh } = body;
  
  if (!refresh) {
    return unauthorized('Refresh token is required');
  }
  
  // Verify refresh token
  let decoded;
  try {
    decoded = await verifyRefreshToken(refresh);
  } catch (error) {
    logger.warn('Invalid refresh token', error);
    return unauthorized('Invalid refresh token');
  }
  
  const prisma = getPrismaClient();
  
  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });
  
  if (!user || user.isBlocked) {
    logger.warn('User not found or blocked', { userId: decoded.userId });
    return unauthorized('Invalid refresh token');
  }
  
  // Issue new tokens
  const tokenPayload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };
  
  const newAccessToken = await issueAccessToken(tokenPayload);
  const newRefreshToken = await issueRefreshToken(tokenPayload);
  
  // Blacklist old refresh token (7 days)
  await blacklistToken(refresh, 7 * 24 * 60 * 60);
  
  logger.info('Token refresh successful', { userId: user.id });
  
  // Response will be automatically transformed
  return success({
    access: newAccessToken,
    refresh: newRefreshToken,
  });
}

export const handler = withErrorHandler(withRequestTransform(refreshHandler));
