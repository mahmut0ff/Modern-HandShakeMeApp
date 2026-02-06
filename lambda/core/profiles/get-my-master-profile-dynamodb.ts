import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { formatUserObject } from '../shared/utils/response-formatter';
import { logger } from '../shared/utils/logger';

const masterProfileRepository = new MasterProfileRepository();
const userRepository = new UserRepository();

async function getMyMasterProfileHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  
  logger.info('Get my master profile', { userId });

  const user = await userRepository.findById(userId);
  if (!user) {
    return notFound('User not found');
  }

  let profile = await masterProfileRepository.findByUserId(userId);
  
  if (!profile) {
    profile = await masterProfileRepository.create(userId, {
      city: user.city || ''
    });
    logger.info('Master profile created', { userId });
  }

  return success({
    ...profile,
    user: formatUserObject(user)
  });
}

export const handler = withErrorHandler(withAuth(getMyMasterProfileHandler));
