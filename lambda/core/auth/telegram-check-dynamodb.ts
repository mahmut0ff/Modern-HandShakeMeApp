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
  sessionId: z.string().min(1, 'Session ID is required'),
});

async function telegramCheckHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('Telegram auth check request received');

  const sessionId = event.queryStringParameters?.sessionId;

  if (!sessionId) {
    return badRequest('sessionId is required as query parameter');
  }

  // Validate sessionId
  try {
    telegramCheckSchema.parse({ sessionId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }

  const sessionRepo = new TelegramAuthSessionRepository();
  const userRepo = new UserRepository();

  // Find auth session by sessionId
  const session = await sessionRepo.findById(sessionId);

  if (!session) {
    // Session not found or expired
    return badRequest('Session not found or expired');
  }

  if (!session.userId && !session.telegramId) {
    // Session exists but not confirmed by bot yet
    return success({
      status: 'pending',
      message: 'Waiting for Telegram confirmation',
    });
  }

  // Confirmed!
  let telegramId = session.telegramId;
  let firstName = session.telegramFirstName || '';
  let lastName = session.telegramLastName || '';
  let username = session.telegramUsername || '';
  let photoUrl = session.telegramPhotoUrl || '';

  // If we have a userId but no telegram data in session, fetch from user record
  if (session.userId && !telegramId) {
    const user = await userRepo.findById(session.userId);
    if (user) {
      telegramId = user.telegramId;
      firstName = user.firstName;
      lastName = user.lastName || '';
      username = user.telegramUsername || '';
      photoUrl = user.avatar || '';
    }
  }

  logger.info('Telegram auth check confirmed', {
    sessionId,
    userId: session.userId,
    telegramId
  });

  return success({
    status: 'confirmed',
    telegramId,
    firstName,
    lastName,
    username,
    photoUrl,
  });
}

export const handler = withErrorHandler(telegramCheckHandler);