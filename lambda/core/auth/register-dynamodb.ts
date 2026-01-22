// Register with DynamoDB

import type { APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '@/shared/repositories/user.repository';
import { SMSService } from '@/shared/services/sms';
import { success, conflict } from '@/shared/utils/response';
import { phoneRegistrationSchema, validate } from '@/shared/utils/validation';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const userRepo = new UserRepository();
const smsService = new SMSService();

async function registerHandler(event: any): Promise<APIGatewayProxyResult> {
  logger.info('Phone registration request received');
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(phoneRegistrationSchema, body);
  
  // Check if user exists
  const existingUser = await userRepo.findByPhone(data.phone);
  
  if (existingUser) {
    logger.warn('Registration failed: phone already exists', { phone: data.phone });
    return conflict('User with this phone number already exists');
  }
  
  // Generate verification code
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  
  // Create user
  const user = await userRepo.create({
    phone: data.phone,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role?.toUpperCase() as 'MASTER' | 'CLIENT',
    verificationCode,
    verificationCodeExpiry,
    isPhoneVerified: false,
  });
  
  // Send SMS
  try {
    await smsService.sendVerificationCode(data.phone, verificationCode);
    logger.info('SMS verification code sent', { userId: user.id, phone: data.phone });
  } catch (smsError) {
    logger.error('Failed to send SMS', { error: smsError, userId: user.id });
  }
  
  logger.info('User registered successfully', { userId: user.id });
  
  return success({
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
    tokens: {
      access: '', // Will be set after verification
      refresh: ''
    },
    message: 'SMS verification code sent to your phone',
  }, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(registerHandler));
