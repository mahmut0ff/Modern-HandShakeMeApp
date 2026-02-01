// Generate Telegram authentication code - DynamoDB version

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import crypto from 'crypto';
import { TelegramAuthSessionRepository } from '../shared/repositories/telegram-auth-session.repository';
import { success, badRequest } from '../shared/utils/response';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const telegramCodeSchema = z.object({
  visitorId: z.string().min(1, 'Visitor ID is required'),
});

/**
 * Generate cryptographically secure 4-digit code
 */
function generateSecureCode(): string {
  // Generate random number between 1000-9999
  const randomBytes = crypto.randomBytes(2);
  const randomNumber = randomBytes.readUInt16BE(0);
  const code = (randomNumber % 9000) + 1000;
  return code.toString();
}

async function telegramCodeHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('Telegram code generation request received');
  
  const visitorId = event.queryStringParameters?.visitorId;
  
  if (!visitorId) {
    return badRequest('visitorId is required as query parameter');
  }
  
  // Validate visitorId
  try {
    telegramCodeSchema.parse({ visitorId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  // Generate cryptographically secure 4-digit code
  const code = generateSecureCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  
  const sessionRepo = new TelegramAuthSessionRepository();
  
  // Create session
  const session = await sessionRepo.create({
    visitorId,
    code,
    expiresAt,
  });
  
  logger.info('Telegram auth code generated', { 
    visitorId, 
    sessionId: session.id 
  });
  
  return success({
    code,
    visitorId,
    expiresIn: 600, // 10 minutes in seconds
    sessionId: session.id,
  });
}

export const handler = withErrorHandler(telegramCodeHandler);