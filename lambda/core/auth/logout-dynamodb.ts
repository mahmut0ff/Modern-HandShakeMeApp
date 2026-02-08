import { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { blacklistToken } from '../shared/services/auth-token.service';
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
  
  // Add refresh token to blacklist using consolidated service
  await blacklistToken(validatedData.refreshToken);
  
  // Also blacklist the access token from the request
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (authHeader) {
    const accessToken = authHeader.replace('Bearer ', '');
    await blacklistToken(accessToken);
  }
  
  logger.info('User logged out successfully', { userId });
  
  return success({
    message: 'Logged out successfully'
  });
}

export const handler = withErrorHandler(withAuth(logoutHandler));
