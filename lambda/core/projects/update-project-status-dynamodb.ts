import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, notFound, forbidden, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { logger } from '../shared/utils/logger';

const projectRepo = new ProjectRepository();

const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'REVIEW', 'REVISION', 'COMPLETED', 'ARCHIVED']),
  progress: z.number().min(0).max(100).optional(),
});

async function updateProjectStatusHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  const projectId = event.pathParameters?.id;

  if (!projectId) {
    return badRequest('Project ID required');
  }

  logger.info('Update project status request', { userId, projectId });

  const project = await projectRepo.findById(projectId);

  if (!project) {
    return notFound('Project not found');
  }

  if (project.masterId !== userId) {
    return forbidden('Only master can update project status');
  }

  const body = JSON.parse(event.body || '{}');
  const validationResult = updateStatusSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;

  const updateData: any = { status: data.status };
  
  if (data.progress !== undefined) {
    updateData.progress = data.progress;
  }

  if (data.status === 'IN_PROGRESS' && !project.startedAt) {
    updateData.startedAt = new Date().toISOString();
  }

  if (data.status === 'COMPLETED' && !project.completedAt) {
    updateData.completedAt = new Date().toISOString();
    updateData.progress = 100;
  }

  const updated = await projectRepo.update(projectId, updateData);

  logger.info('Project status updated', { userId, projectId, status: data.status });

  return success(updated);
}

export const handler = withErrorHandler(withAuth(updateProjectStatusHandler, { roles: ['MASTER'] }));
