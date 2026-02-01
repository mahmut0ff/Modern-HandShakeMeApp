// Update current user Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, badRequest, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { validate } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';
import { UserRepository } from '../shared/repositories/user.repository';
import { z } from 'zod';

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

async function updateCurrentUserHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Update current user request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(updateUserSchema, body);
  
  const userRepository = new UserRepository();
  
  // Check if user exists
  const existingUser = await userRepository.findById(userId);
  if (!existingUser) {
    return notFound('User not found');
  }
  
  // Update user
  const updatedUser = await userRepository.update(userId, {
    firstName: data.firstName,
    lastName: data.lastName,
    twoFactorEnabled: data.twoFactorEnabled,
  });
  
  logger.info('User updated successfully', { userId });
  
  // Format response to match mobile app expectations
  const response = {
    id: updatedUser.id,
    phone: updatedUser.phone,
    role: updatedUser.role.toLowerCase(),
    first_name: updatedUser.firstName,
    last_name: updatedUser.lastName,
    full_name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
    avatar: updatedUser.avatar,
    is_phone_verified: updatedUser.isPhoneVerified,
    two_factor_enabled: updatedUser.twoFactorEnabled || false,
    last_seen: updatedUser.lastSeen,
    created_at: updatedUser.createdAt,
    updated_at: updatedUser.updatedAt,
  };
  
  return success(response);
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(updateCurrentUserHandler)
  )
);