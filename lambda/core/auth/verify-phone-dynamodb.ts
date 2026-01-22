// Verify phone with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '@/shared/repositories/user.repository';
import { issueAccessToken, issueRefreshToken } from '@/shared/services/token';
import { success, badRequest } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const userRepo = new UserRepository();

async function verifyPhoneHandler(event: any): Promise<APIGatewayProxyResult> {
  logger.info('Phone verification request received');
  
  const body = JSON.parse(event.body || '{}');
  const { phone, code } = body;
  
  if (!phone || !code) {
    return badRequest('Phone and code are required');
  }
  
  const user = await userRepo.findByPhone(phone);
  
  if (!user) {
    logger.warn('Phone verification failed: user not found', { phone });
    return badRequest('Invalid phone number or verification code');
  }
  
  if (!user.verificationCode || user.verificationCode !== code) {
    logger.warn('Phone verification failed: invalid code', { userId: user.id });
    return badRequest('Invalid verification code');
  }
  
  if (!user.verificationCodeExpiry || new Date(user.verificationCodeExpiry) < new Date()) {
    logger.warn('Phone verification failed: code expired', { userId: user.id });
    return badRequest('Verification code has expired');
  }
  
  await userRepo.update(user.id, {
    isPhoneVerified: true,
    verificationCode: undefined,
    verificationCodeExpiry: undefined,
  });
  
  const accessToken = await issueAccessToken({
    userId: user.id,
    email: user.email || user.phone,
    role: user.role,
  });
  
  const refreshToken = await issueRefreshToken({
    userId: user.id,
    email: user.email || user.phone,
    role: user.role,
  });
  
  logger.info('Phone verification successful', { userId: user.id });
  
  return success({
    message: 'Phone number verified successfully',
    user: {
      id: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      isPhoneVerified: true,
      createdAt: user.createdAt,
    },
    access: accessToken,
    refresh: refreshToken,
  });
}

export const handler = withErrorHandler(withRequestTransform(verifyPhoneHandler));
