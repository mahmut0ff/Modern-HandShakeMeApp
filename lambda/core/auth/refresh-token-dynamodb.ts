import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { UserRepository } from '../shared/repositories/user.repository';
import { verifyRefreshToken, generateTokenPair } from '../shared/services/auth-token.service';
import { success, badRequest, unauthorized, notFound } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
  refresh: z.string().optional(),
}).refine(data => data.refreshToken || data.refresh, {
  message: "Either refreshToken or refresh must be provided",
});

async function refreshTokenHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  logger.info('Refresh token request');

  // Validate request body exists
  if (!event.body) {
    throw new ValidationError('Request body is required');
  }

  const body = JSON.parse(event.body);

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

  const token = validatedData.refreshToken || validatedData.refresh;

  if (!token) {
    throw new ValidationError('Token is missing');
  }

  // Verify refresh token (includes blacklist check)
  let decoded;
  try {
    decoded = await verifyRefreshToken(token);
  } catch (error: any) {
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

  // Generate new tokens using consolidated service
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email || user.phone || '',
    role: user.role,
    phone: user.phone,
    isVerified: user.isPhoneVerified,
  });

  logger.info('Tokens refreshed successfully', { userId: user.id });

  return success({
    access: tokens.accessToken,
    refresh: tokens.refreshToken,
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
