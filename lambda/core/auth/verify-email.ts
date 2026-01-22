// Email verification Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, error } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function verifyEmailHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('Email verification request received');
  
  // Parse request body
  const body = JSON.parse(event.body || '{}');
  const { email, code } = body;
  
  if (!email || !code) {
    return error('VALIDATION_ERROR', 'Email and code are required', 400);
  }
  
  const prisma = getPrismaClient();
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    return error('NOT_FOUND', 'User not found', 404);
  }
  
  if (user.isVerified) {
    return success({ message: 'Email already verified' });
  }
  
  // Check verification code
  if (user.verificationCode !== code) {
    logger.warn('Invalid verification code', { userId: user.id });
    return error('INVALID_CODE', 'Invalid verification code', 400);
  }
  
  // Check if code expired
  if (user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()) {
    logger.warn('Verification code expired', { userId: user.id });
    return error('CODE_EXPIRED', 'Verification code expired', 400);
  }
  
  // Mark user as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    },
  });
  
  logger.info('Email verified successfully', { userId: user.id });
  
  return success({ message: 'Email verified successfully' });
}

export const handler = withErrorHandler(verifyEmailHandler);
