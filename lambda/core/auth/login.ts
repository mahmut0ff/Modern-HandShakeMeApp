// Login Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { issueAccessToken, issueRefreshToken } from '@/shared/services/token';
import { phoneLoginSchema, validate } from '@/shared/utils/validation';
import { success, unauthorized } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { SMSService } from '@/shared/services/sms';

const smsService = new SMSService();

async function loginHandler(
  event: any
): Promise<APIGatewayProxyResult> {
  logger.info('Phone login request received');
  
  // Request is already transformed by withRequestTransform middleware
  const body = JSON.parse(event.body || '{}');
  const data = validate(phoneLoginSchema, body);
  
  const prisma = getPrismaClient();
  
  // Find user by phone
  const user = await prisma.user.findFirst({
    where: {
      phone: data.phone,
    },
  });
  
  if (!user) {
    logger.warn('Login failed: user not found', { phone: data.phone });
    return unauthorized('Invalid phone number');
  }
  
  // If code is provided, verify it
  if (data.code) {
    // Verify SMS code
    if (!user.verificationCode || user.verificationCode !== data.code) {
      logger.warn('Login failed: invalid verification code', { userId: user.id });
      return unauthorized('Invalid verification code');
    }
    
    // Check if code is expired
    if (user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()) {
      logger.warn('Login failed: verification code expired', { userId: user.id });
      return unauthorized('Verification code expired');
    }
    
    // Mark phone as verified if not already
    if (!user.isPhoneVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isPhoneVerified: true,
          verificationCode: null,
          verificationCodeExpiry: null,
        },
      });
    }
  } else {
    // Send new verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
    
    try {
      await smsService.sendVerificationCode(data.phone, verificationCode);
      logger.info('SMS verification code sent for login', { userId: user.id });
    } catch (smsError) {
      logger.error('Failed to send SMS for login', { error: smsError, userId: user.id });
      return unauthorized('Failed to send verification code');
    }
    
    // Response will be automatically transformed
    return success({
      message: 'Verification code sent to your phone',
      requiresVerification: true,
    });
  }
  
  // Check if user is blocked
  if (user.isBlocked) {
    logger.warn('Login failed: user blocked', { userId: user.id });
    return unauthorized('Your account has been blocked');
  }
  
  // Issue tokens
  const tokenPayload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };
  
  const accessToken = await issueAccessToken(tokenPayload);
  const refreshToken = await issueRefreshToken(tokenPayload);
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  
  logger.info('Login successful', { userId: user.id });
  
  // Response will be automatically transformed by success() helper
  return success({
    access: accessToken,
    refresh: refreshToken,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    },
  });
}

export const handler = withErrorHandler(withRequestTransform(loginHandler));
