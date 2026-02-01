// Telegram Register with DynamoDB

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { UserRepository } from '../shared/repositories/user.repository';
import { issueAccessToken, issueRefreshToken } from '../shared/services/token';
import { success, badRequest } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const telegramRegisterSchema = z.object({
  telegramId: z.union([z.number(), z.string()]).transform(val => val.toString()),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  username: z.string().optional(),
  photoUrl: z.string().optional(),
  role: z.enum(['client', 'master'], {
    errorMap: () => ({ message: 'Role must be either client or master' })
  }),
  phone: z.string().optional(),
});

async function telegramRegisterHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  logger.info('Telegram register request received');
  
  const body = JSON.parse(event.body || '{}');
  
  // Validate input
  let validatedData;
  try {
    validatedData = telegramRegisterSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  const userRepo = new UserRepository();
  
  // Check if user already exists
  const existingUser = await userRepo.findByTelegramId(validatedData.telegramId);
  if (existingUser) {
    logger.warn('Telegram register: user already exists', { telegramId: validatedData.telegramId });
    return badRequest('User with this Telegram ID already exists');
  }
  
  // Create new user
  const role = validatedData.role === 'master' ? 'MASTER' : 'CLIENT';
  
  const newUser = await userRepo.create({
    firstName: validatedData.firstName,
    lastName: validatedData.lastName || '',
    telegramId: validatedData.telegramId,
    telegramUsername: validatedData.username,
    telegramPhotoUrl: validatedData.photoUrl,
    avatar: validatedData.photoUrl,
    role: role,
    phone: validatedData.phone || '',
    email: undefined,
    isPhoneVerified: false,
  });
  
  logger.info('Telegram register: user created', { userId: newUser.id });
  
  // Issue tokens
  const tokenPayload = {
    userId: newUser.id,
    email: newUser.email || newUser.phone || newUser.telegramId,
    role: newUser.role,
  };
  
  const accessToken = await issueAccessToken(tokenPayload);
  const refreshToken = await issueRefreshToken(tokenPayload);
  
  logger.info('Telegram registration successful', { userId: newUser.id });
  
  return success({
    access: accessToken,
    refresh: refreshToken,
    user: {
      id: newUser.id,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      fullName: newUser.name,
      telegramId: newUser.telegramId,
      telegramUsername: newUser.telegramUsername,
      avatar: newUser.avatar,
      isPhoneVerified: newUser.isPhoneVerified,
      createdAt: newUser.createdAt,
    },
  });
}

export const handler = withErrorHandler(telegramRegisterHandler);
