// Get current user Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { UserRepository } from '../shared/repositories/user.repository';

async function getCurrentUserHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get current user request', { userId });
  
  const userRepository = new UserRepository();
  const user = await userRepository.findById(userId);
  
  if (!user) {
    logger.warn('User not found', { userId });
    return notFound('User not found');
  }
  
  logger.info('Current user retrieved successfully', { userId });
  
  // Format response to match mobile app expectations
  const response = {
    id: user.id,
    phone: user.phone,
    role: user.role.toLowerCase(),
    first_name: user.firstName,
    last_name: user.lastName,
    full_name: `${user.firstName} ${user.lastName}`.trim(),
    avatar: user.avatar,
    is_phone_verified: user.isPhoneVerified,
    two_factor_enabled: user.twoFactorEnabled || false,
    last_seen: user.lastSeen,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
  
  return success(response);
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getCurrentUserHandler)
  )
);