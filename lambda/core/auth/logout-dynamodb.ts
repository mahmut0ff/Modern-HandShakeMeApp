import { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { putItem } from '../shared/db/dynamodb-client';
import { Keys } from '../shared/db/dynamodb-keys';
import { success, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

async function logoutHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Logout request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  
  // Validate input
  let validatedData;
  try {
    validatedData = logoutSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  // Add refresh token to blacklist
  await putItem({
    ...Keys.tokenBlacklist(validatedData.refreshToken),
    token: validatedData.refreshToken,
    userId: userId,
    blacklistedAt: new Date().toISOString(),
    expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
  });
  
  logger.info('User logged out successfully', { userId });
  
  return success({
    message: 'Logged out successfully'
  });
}

export const handler = withErrorHandler(withAuth(logoutHandler));
