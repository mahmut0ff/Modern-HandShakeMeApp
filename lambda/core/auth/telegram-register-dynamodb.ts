import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { UserRepository } from '../shared/repositories/user.repository';
import { generateTokenPair } from '../shared/services/auth-token.service';
import { success, badRequest } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const telegramRegisterSchema = z.object({
  // Support both camelCase and snake_case for flexibility
  telegramId: z.union([z.number(), z.string()]).transform(val => val.toString()).optional(),
  telegram_id: z.union([z.number(), z.string()]).transform(val => val.toString()).optional(),
  firstName: z.string().min(1).optional(),
  first_name: z.string().min(1).optional(),
  lastName: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photoUrl: z.string().optional(),
  photo_url: z.string().optional(),
  role: z.enum(['client', 'master', 'CLIENT', 'MASTER'], {
    errorMap: () => ({ message: 'Role must be either client or master' })
  }),
  phone: z.string().optional(),
  citizenship: z.string().optional(),
  city: z.string().optional(),
}).refine(data => data.telegramId || data.telegram_id, {
  message: 'Telegram ID is required'
}).refine(data => data.firstName || data.first_name, {
  message: 'First name is required'
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

  // Normalize field names (support both camelCase and snake_case)
  const telegramId = validatedData.telegramId || validatedData.telegram_id || '';
  const firstName = validatedData.firstName || validatedData.first_name || '';
  const lastName = validatedData.lastName || validatedData.last_name || '';
  const photoUrl = validatedData.photoUrl || validatedData.photo_url;

  // Check if user already exists
  const existingUser = await userRepo.findByTelegramId(telegramId);
  if (existingUser) {
    logger.info('Telegram register: user already exists, returning tokens', { telegramId });

    const tokens = generateTokenPair({
      userId: existingUser.id,
      email: existingUser.email || existingUser.phone || existingUser.telegramId,
      role: existingUser.role,
      phone: existingUser.phone,
      isVerified: existingUser.isPhoneVerified,
    });

    return success({
      tokens: {
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      },
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
        citizenship: existingUser.citizenship,
        city: existingUser.city,
        createdAt: existingUser.createdAt,
      },
      message: 'Logged in successfully (existing user)',
    });
  }

  // Create new user
  const role = validatedData.role.toUpperCase() === 'MASTER' ? 'MASTER' : 'CLIENT';

  const newUser = await userRepo.create({
    firstName: firstName,
    lastName: lastName,
    telegramId: telegramId,
    telegramUsername: validatedData.username,
    telegramPhotoUrl: photoUrl,
    avatar: photoUrl,
    role: role,
    phone: validatedData.phone || `tg_${telegramId}`,
    email: undefined,
    isPhoneVerified: false,
    citizenship: validatedData.citizenship,
    city: validatedData.city,
    registrationStep: 'COMPLETED',
    registrationSource: 'APP',
  });

  logger.info('Telegram register: user created', { userId: newUser.id });

  // Issue tokens using consolidated service
  const tokens = generateTokenPair({
    userId: newUser.id,
    email: newUser.email || newUser.phone || newUser.telegramId,
    role: newUser.role,
    phone: newUser.phone,
    isVerified: newUser.isPhoneVerified,
  });

  logger.info('Telegram registration successful', { userId: newUser.id });

  return success({
    tokens: {
      access: tokens.accessToken,
      refresh: tokens.refreshToken,
    },
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
      citizenship: newUser.citizenship,
      city: newUser.city,
      createdAt: newUser.createdAt,
    },
    message: 'Registration successful',
  });
}

export const handler = withErrorHandler(telegramRegisterHandler);
