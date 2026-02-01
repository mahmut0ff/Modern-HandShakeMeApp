import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { UserRepository } from '../shared/repositories/user.repository';
import { verifyToken, issueAccessToken, issueRefreshToken } from '../shared/services/token';
import { getItem } from '../shared/db/dynamodb-client';
import { Keys } from '../shared/db/dynamodb-keys';
import { success, badRequest, unauthorized, notFound } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

async function refreshTokenHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  logger.info('Refresh token request');
  
  const body = JSON.parse(event.body || '{}');
  
  // Validate input
  let validatedData;
  try {
    validatedData = refreshTokenSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  // Check if token is blacklisted
  const blacklistedToken = await getItem(Keys.tokenBlacklist(validatedData.refreshToken));
  if (blacklistedToken) {
    logger.warn('Attempted to use blacklisted refresh token');
    return unauthorized('Token has been revoked');
  }
  
  // Verify refresh token
  let decoded;
  try {
    decoded = verifyToken(validatedData.refreshToken);
  } catch (error) {
    logger.warn('Invalid refresh token', { error: error.message });
    return unauthorized('Invalid or expired refresh token');
  }
  
  // Get user
  const userRepo = new UserRepository();
  const user = await userRepo.findById(decoded.userId);
  if (!user) {
    logger.warn('User not found for refresh token', { userId: decoded.userId });
    return notFound('User not found');
  }
  
  // Generate new tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email || user.phone,
    role: user.role,
  };
  
  const accessToken = await issueAccessToken(tokenPayload);
  const newRefreshToken = await issueRefreshToken(tokenPayload);
  
  logger.info('Tokens refreshed successfully', { userId: user.id });
  
  return success({
    access: accessToken,
    refresh: newRefreshToken,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.name,
    },
  });
}

export const handler = withErrorHandler(refreshTokenHandler);
