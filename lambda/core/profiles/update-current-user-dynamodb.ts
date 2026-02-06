import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { UserRepository } from '../shared/repositories/user.repository';
import { formatUserObject } from '../shared/utils/response-formatter';
import { logger } from '../shared/utils/logger';

const userRepository = new UserRepository();

const updateUserSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().max(100).optional(),
  avatar: z.string().url().optional().nullable(),
});

async function updateCurrentUserHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  
  logger.info('Update current user', { userId });

  const body = JSON.parse(event.body || '{}');
  const validationResult = updateUserSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;
  
  const updatedUser = await userRepository.update(userId, {
    firstName: data.first_name,
    lastName: data.last_name,
    avatar: data.avatar
  });

  logger.info('User updated', { userId });

  return success(formatUserObject(updatedUser));
}

export const handler = withErrorHandler(withAuth(updateCurrentUserHandler));
