// Login with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '@/shared/repositories/user.repository';
import { issueAccessToken, issueRefreshToken } from '@/shared/services/token';
import { phoneLoginSchema, validate } from '@/shared/utils/validation';
import { success, unauthorized } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const userRepo = new UserRepository();

async function loginHandler(event: any): Promise<APIGatewayProxyResult> {
  logger.info('Phone login request received');
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(phoneLoginSchema, body);
  
  const user = await userRepo.findByPhone(data.phone);
  
  if (!user) {
    logger.warn('Login failed: user not found', { phone: data.phone });
    return unauthorized('Invalid phone number or verification code');
  }
  
  if (!user.verificationCode || user.verificationCode !== data.code) {
    logger.warn('Login failed: invalid verification code', { userId: user.id });
    return unauthorized('Invalid phone number or verification code');
  }
  
  if (!user.verificationCodeExpiry || new Date(user.verificationCodeExpiry) < new Date()) {
    logger.warn('Login failed: verification code expired', { userId: user.id });
    return unauthorized('Verification code has expired');
  }
  
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
  
  await userRepo.update(user.id, {
    lastLoginAt: new Date().toISOString(),
    isOnline: true,
  });
  
  logger.info('Login successful', { userId: user.id });
  
  return success({
    access: accessToken,
    refresh: refreshToken,
    user: {
      id: user.userId,
      phone: user.phone,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar || null,
      is_phone_verified: user.isPhoneVerified,
      created_at: user.createdAt,
    },
  });
}

export const handler = withErrorHandler(withRequestTransform(loginHandler));
