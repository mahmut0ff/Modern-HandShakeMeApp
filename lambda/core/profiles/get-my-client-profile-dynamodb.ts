import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ClientProfileRepository } from '../shared/repositories/client-profile.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { formatUserObject } from '../shared/utils/response-formatter';
import { logger } from '../shared/utils/logger';

const clientProfileRepository = new ClientProfileRepository();
const userRepository = new UserRepository();

async function getMyClientProfileHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  
  logger.info('Get my client profile', { userId });

  const user = await userRepository.findById(userId);
  if (!user) {
    return notFound('User not found');
  }

  let profile = await clientProfileRepository.findByUserId(userId);
  
  if (!profile) {
    profile = await clientProfileRepository.create(userId, {
      city: user.city || ''
    });
    logger.info('Client profile created', { userId });
  }

  return success({
    ...profile,
    user: formatUserObject(user)
  });
}

export const handler = withErrorHandler(withAuth(getMyClientProfileHandler));
