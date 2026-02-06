import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound, forbidden, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { logger } from '../shared/utils/logger';

const projectRepo = new ProjectRepository();

async function getProjectHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  const projectId = event.pathParameters?.id;

  if (!projectId) {
    return badRequest('Project ID required');
  }

  logger.info('Get project', { userId, projectId });

  const project = await projectRepo.findById(projectId);

  if (!project) {
    return notFound('Project not found');
  }

  if (project.masterId !== userId && project.clientId !== userId) {
    return forbidden('You do not have access to this project');
  }

  return success(project);
}

export const handler = withErrorHandler(withAuth(getProjectHandler));
