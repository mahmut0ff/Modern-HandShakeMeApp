// Telegram Login with DynamoDB

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { UserRepository } from '../shared/repositories/user.repository';
import { issueAccessToken, issueRefreshToken } from '../shared/services/token';
import { success, unauthorized, badRequest } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';
import { TelegramService, TelegramLoginData } from '../shared/services/telegram';

const telegramLoginSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string().min(1, 'Hash is required'),
});

async function telegramLoginHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  logger.info('Telegram login request received');
  
  const body = JSON.parse(event.body || '{}');
  
  // Validate input
  let loginData: TelegramLoginData;
  try {
    loginData = telegramLoginSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  const userRepo = new UserRepository();
  const telegramService = TelegramService.getInstance();
  
  // Verify auth data is fresh (not older than 24 hours)
  if (!telegramService.isAuthDataFresh(loginData.auth_date)) {
    logger.warn('Telegram login: auth data expired');
    return unauthorized('Auth data expired. Please try again.');
  }
  
  // Verify Telegram signature
  if (!telegramService.verifyLoginData(loginData)) {
    logger.warn('Telegram login: invalid signature');
    return unauthorized('Invalid Telegram signature');
  }
  
  // Find user by Telegram ID
  const existingUser = await userRepo.findByTelegramId(loginData.id.toString());
  
  if (existingUser) {
    // User exists - login
    logger.info('Telegram login: existing user', { userId: existingUser.id });
    
    // Update last login and Telegram data
    await userRepo.update(existingUser.id, {
      lastLoginAt: new Date().toISOString(),
      telegramUsername: loginData.username,
      telegramPhotoUrl: loginData.photo_url,
      avatar: loginData.photo_url || existingUser.avatar,
      isOnline: true,
    });
    
    // Issue tokens
    const tokenPayload = {
      userId: existingUser.id,
      email: existingUser.email || existingUser.phone,
      role: existingUser.role,
    };
    
    const accessToken = await issueAccessToken(tokenPayload);
    const refreshToken = await issueRefreshToken(tokenPayload);
    
    logger.info('Telegram login successful', { userId: existingUser.id });
    
    return success({
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: existingUser.id,
        phone: existingUser.phone,
        email: existingUser.email,
        role: existingUser.role,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        fullName: existingUser.name,
        telegramId: existingUser.telegramId,
        telegramUsername: existingUser.telegramUsername,
        avatar: existingUser.avatar,
        isPhoneVerified: existingUser.isPhoneVerified,
        createdAt: existingUser.createdAt,
      },
      isNewUser: false,
    });
  } else {
    // New user - return Telegram data for registration
    logger.info('Telegram login: new user', { telegramId: loginData.id });
    
    return success({
      isNewUser: true,
      telegramData: {
        id: loginData.id,
        firstName: loginData.first_name,
        lastName: loginData.last_name,
        username: loginData.username,
        photoUrl: loginData.photo_url,
      },
      message: 'New user. Please complete registration.',
    });
  }
}

export const handler = withErrorHandler(telegramLoginHandler);