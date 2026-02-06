import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound, forbidden, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { logger } from '../shared/utils/logger';

const projectRepo = new ProjectRepository();
const orderRepo = new OrderRepository();

async function completeProjectHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  const projectId = event.pathParameters?.id;

  if (!projectId) {
    return badRequest('Project ID required');
  }

  logger.info('Complete project request', { userId, projectId });

  const project = await projectRepo.findById(projectId);

  if (!project) {
    return notFound('Project not found');
  }

  if (project.clientId !== userId) {
    return forbidden('Only client can complete project');
  }

  const updated = await projectRepo.update(projectId, {
    status: 'COMPLETED',
    progress: 100,
    completedAt: new Date().toISOString(),
  });

  await orderRepo.update(project.orderId, { status: 'COMPLETED' });

  logger.info('Project completed', { userId, projectId });

  return success(updated);
}

export const handler = withErrorHandler(withAuth(completeProjectHandler, { roles: ['CLIENT'] }));
