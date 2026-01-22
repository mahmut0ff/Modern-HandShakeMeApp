// Phone verification Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { issueAccessToken, issueRefreshToken } from '@/shared/services/token';
import { phoneVerificationSchema, validate } from '@/shared/utils/validation';
import { success, badRequest } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function verifyPhoneHandler(
  event: any
): Promise<APIGatewayProxyResult> {
  logger.info('Phone verification request received');
  
  // Request is already transformed by withRequestTransform middleware
  const body = JSON.parse(event.body || '{}');
  const data = validate(phoneVerificationSchema, body);
  
  const prisma = getPrismaClient();
  
  // Find user by phone
  const user = await prisma.user.findFirst({
    where: {
      phone: data.phone,
    },
  });
  
  if (!user) {
    logger.warn('Phone verification failed: user not found', { phone: data.phone });
    return badRequest('User not found');
  }
  
  // Check verification code
  if (!user.verificationCode || user.verificationCode !== data.code) {
    logger.warn('Phone verification failed: invalid code', { userId: user.id });
    return badRequest('Invalid verification code');
  }
  
  // Check if code is expired
  if (user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()) {
    logger.warn('Phone verification failed: code expired', { userId: user.id });
    return badRequest('Verification code expired');
  }
  
  // Update user as verified
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isPhoneVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      phone: true,
      role: true,
      firstName: true,
      lastName: true,
      isPhoneVerified: true,
      createdAt: true,
    },
  });
  
  // Issue tokens
  const tokenPayload = {
    userId: updatedUser.id,
    phone: updatedUser.phone,
    role: updatedUser.role,
  };
  
  const accessToken = await issueAccessToken(tokenPayload);
  const refreshToken = await issueRefreshToken(tokenPayload);
  
  logger.info('Phone verification successful', { userId: updatedUser.id });
  
  // Response will be automatically transformed
  return success({
    message: 'Phone verified successfully',
    user: {
      id: updatedUser.id,
      phone: updatedUser.phone,
      role: updatedUser.role,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      isPhoneVerified: updatedUser.isPhoneVerified,
      createdAt: updatedUser.createdAt,
    },
    tokens: {
      access: accessToken,
      refresh: refreshToken,
    },
  });
}

export const handler = withErrorHandler(withRequestTransform(verifyPhoneHandler));