// Logout Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { blacklistToken } from '@/shared/services/token';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function logoutHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  logger.info('Logout request received', { userId: event.auth.userId });
  
  // Extract tokens from headers and body
  const authHeader = event.headers.Authorization || event.headers.authorization;
  const accessToken = authHeader?.replace('Bearer ', '') || '';
  
  const body = JSON.parse(event.body || '{}');
  const { refreshToken } = body;
  
  // Blacklist access token (15 minutes)
  if (accessToken) {
    await blacklistToken(accessToken, 15 * 60);
  }
  
  // Blacklist refresh token (7 days)
  if (refreshToken) {
    await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
  }
  
  logger.info('Logout successful', { userId: event.auth.userId });
  
  return success({ message: 'Logged out successfully' });
}

export const handler = withErrorHandler(withAuth(logoutHandler));
