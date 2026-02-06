import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { UserRepository } from '../shared/repositories/user.repository';
import { formatUserObject } from '../shared/utils/response-formatter';
import { logger } from '../shared/utils/logger';

const userRepository = new UserRepository();

async function getCurrentUserHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  
  logger.info('Get current user', { userId });

  const user = await userRepository.findById(userId);
  if (!user) {
    return notFound('User not found');
  }

  return success(formatUserObject(user));
}

export const handler = withErrorHandler(withAuth(getCurrentUserHandler));
