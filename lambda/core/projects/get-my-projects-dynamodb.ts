import type { APIGatewayProxyResult } from 'aws-lambda';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { logger } from '../shared/utils/logger';

const projectRepo = new ProjectRepository();

async function getMyProjectsHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;

  logger.info('Get my projects', { userId });

  const projects = await projectRepo.findByUser(userId);

  logger.info('Projects fetched', { userId, count: projects.length });

  return success(projects);
}

export const handler = withErrorHandler(withAuth(getMyProjectsHandler));
