// Check Telegram authentication status - DynamoDB version

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { TelegramAuthSessionRepository } from '../shared/repositories/telegram-auth-session.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { issueAccessToken, issueRefreshToken } from '../shared/services/token';
import { success, badRequest } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const telegramCheckSchema = z.object({
  visitorId: z.string().min(1, 'Visitor ID is required'),
});

async function telegramCheckHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('Telegram auth check request received');
  
  const visitorId = event.queryStringParameters?.visitorId;
  
  if (!visitorId) {
    return badRequest('visitorId is required as query parameter');
  }
  
  // Validate visitorId
  try {
    telegramCheckSchema.parse({ visitorId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  const sessionRepo = new TelegramAuthSessionRepository();
  const userRepo = new UserRepository();
  
  // Find auth session by visitorId
  const session = await sessionRepo.findByVisitorId(visitorId);
  
  if (!session) {
    // Session not found or expired - not authenticated yet
    return success({
      authenticated: false,
      message: 'Waiting for Telegram confirmation',
    });
  }
  
  if (!session.userId) {
    // Code confirmed but no user associated yet
    // This means the user is new and needs to complete registration
    // Check if we have telegram data from the session
    if (session.telegramId) {
      return success({
        authenticated: false,
        needsRegistration: true,
        telegramData: {
          id: session.telegramId,
          firstName: session.telegramFirstName || '',
          lastName: session.telegramLastName || '',
          username: session.telegramUsername || '',
          photoUrl: session.telegramPhotoUrl || '',
        },
        message: 'New user - registration required',
      });
    }
    
    return success({
      authenticated: false,
      message: 'Code confirmed but user not found',
    });
  }
  
  // Mark session as used
  await sessionRepo.markAsUsed(session.id, session.userId);
  
  // Get user details
  const user = await userRepo.findById(session.userId);
  
  if (!user) {
    logger.error('User not found after successful session', { userId: session.userId });
    return success({
      authenticated: false,
      message: 'User not found',
    });
  }
  
  // Update user last login
  await userRepo.update(user.id, {
    lastLoginAt: new Date().toISOString(),
    isOnline: true,
  });
  
  // Issue tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email || user.phone,
    role: user.role,
  };
  
  const accessToken = await issueAccessToken(tokenPayload);
  const refreshToken = await issueRefreshToken(tokenPayload);
  
  logger.info('Telegram authentication successful', { 
    userId: user.id,
    visitorId 
  });
  
  return success({
    authenticated: true,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.name,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    },
    tokens: {
      access: accessToken,
      refresh: refreshToken,
    },
  });
}

export const handler = withErrorHandler(telegramCheckHandler);