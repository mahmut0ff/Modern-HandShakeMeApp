import { APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function getMyApplicationsHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return success([]); // Masters only, return empty for others
  }
  
  logger.info('Get my applications request', { userId });
  
  const applicationRepo = new ApplicationRepository();
  const applications = await applicationRepo.findByMaster(userId);
  
  logger.info('Applications retrieved successfully', {
    userId,
    count: applications.length,
  });
  
  return success(applications);
}

export const handler = withErrorHandler(withAuth(getMyApplicationsHandler, { roles: ['MASTER'] }));
