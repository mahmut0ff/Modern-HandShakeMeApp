import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, notFound, forbidden, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { logger } from '../shared/utils/logger';

const projectRepository = new ProjectRepository();

const cancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

async function cancelProjectHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  const projectId = event.pathParameters?.id;

  if (!projectId) {
    return badRequest('Project ID required');
  }

  logger.info('Cancel project request', { userId, projectId });

  const project = await projectRepository.findById(projectId);
  if (!project) {
    return notFound('Project not found');
  }

  if (project.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to cancel this project');
  }

  const body = JSON.parse(event.body || '{}');
  const validationResult = cancelSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }

  const { reason } = validationResult.data;

  const updatedProject = await projectRepository.update(projectId, {
    status: 'CANCELLED',
    notes: reason,
    cancelledAt: new Date().toISOString()
  });

  logger.info('Project cancelled', { userId, projectId });

  return success(updatedProject);
}

export const handler = withErrorHandler(withAuth(cancelProjectHandler));
