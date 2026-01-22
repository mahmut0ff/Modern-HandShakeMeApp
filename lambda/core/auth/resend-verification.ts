// Resend verification code Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { resendVerificationSchema, validate } from '@/shared/utils/validation';
import { success, badRequest, tooManyRequests } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';
import { SMSService } from '@/shared/services/sms';

const smsService = new SMSService();

async function resendVerificationHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('Resend verification request received');
  
  // Parse and validate request body
  const body = JSON.parse(event.body || '{}');
  const data = validate(resendVerificationSchema, body);
  
  const prisma = getPrismaClient();
  
  // Find user by phone
  const user = await prisma.user.findFirst({
    where: {
      phone: data.phone,
    },
  });
  
  if (!user) {
    logger.warn('Resend verification failed: user not found', { phone: data.phone });
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      }),
    };
  }
  
  // Check if user is already verified
  if (user.is_phone_verified) {
    logger.info('Resend verification: user already verified', { userId: user.id });
    return success({
      message: 'Phone number is already verified',
    });
  }
  
  // Rate limiting: Check if last code was sent less than 1 minute ago
  if (user.verificationCodeExpiry) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const codeCreatedAt = new Date(user.verificationCodeExpiry.getTime() - 15 * 60 * 1000);
    
    if (codeCreatedAt > oneMinuteAgo) {
      logger.warn('Resend verification rate limited', { userId: user.id });
      return tooManyRequests('Please wait before requesting another code');
    }
  }
  
  // Generate new verification code
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Update user with new code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });
  
  // Send SMS verification code
  try {
    await smsService.sendVerificationCode(data.phone, verificationCode);
    logger.info('SMS verification code resent', { userId: user.id });
  } catch (smsError) {
    logger.error('Failed to resend SMS', { error: smsError, userId: user.id });
    return badRequest('Failed to send verification code');
  }
  
  logger.info('Verification code resent successfully', { userId: user.id });
  
  return success({
    message: 'Verification code sent successfully',
  });
}

export const handler = withErrorHandler(resendVerificationHandler);