// Registration Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { phoneRegistrationSchema, validate } from '@/shared/utils/validation';
import { success } from '@/shared/utils/response';
import { withErrorHandler, ConflictError } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { SMSService } from '@/shared/services/sms';
import { convertEnumsToUppercase } from '@/shared/utils/enum-converter';

const smsService = new SMSService();

async function registerHandler(
  event: any
): Promise<APIGatewayProxyResult> {
  logger.info('Phone registration request received');
  
  // Request is already transformed by withRequestTransform middleware
  const body = JSON.parse(event.body || '{}');
  const data = validate(phoneRegistrationSchema, body);
  
  const prisma = getPrismaClient();
  
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      phone: data.phone,
    },
  });
  
  if (existingUser) {
    throw new ConflictError('User with this phone number already exists');
  }
  
  // Generate 4-digit verification code
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Convert enums to UPPERCASE for database
  const dbData = convertEnumsToUppercase({ role: data.role });
  
  // Create user with phone-based registration
  const user = await prisma.user.create({
    data: {
      phone: data.phone,
      role: dbData.role as any,
      firstName: data.firstName,
      lastName: data.lastName,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      isPhoneVerified: false,
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
  
  // Send SMS verification code
  try {
    await smsService.sendVerificationCode(data.phone, verificationCode);
    logger.info('SMS verification code sent', { userId: user.id, phone: data.phone });
  } catch (smsError) {
    logger.error('Failed to send SMS', { error: smsError, userId: user.id });
    // Continue registration even if SMS fails - user can request resend
  }
  
  logger.info('User registered successfully', { userId: user.id });
  
  // Response will be automatically transformed by success() helper
  return success(
    {
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
      message: 'Registration successful. SMS verification code sent.',
    },
    { statusCode: 201 }
  );
}

export const handler = withErrorHandler(withRequestTransform(registerHandler));
