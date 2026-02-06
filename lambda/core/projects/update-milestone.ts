// Update project milestone

import { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { MilestoneRepository } from '../shared/repositories/milestone.repository';

const projectRepository = new ProjectRepository();
const milestoneRepository = new MilestoneRepository();

const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  orderNum: z.number().int().nonnegative().optional(),
});

const updateMilestoneHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  const milestoneId = event.pathParameters?.id;
  const projectId = event.pathParameters?.projectId;
  
  if (!milestoneId) {
    return badRequest('Milestone ID is required');
  }

  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('Update milestone request', { userId, milestoneId, projectId });
  
  const body = JSON.parse(event.body || '{}');
  const data = updateMilestoneSchema.parse(body);
  
  // Get project to verify ownership
  const project = await projectRepository.findById(projectId);
  if (!project) {
    return notFound('Project not found');
  }
  
  // Only client or master can update milestones
  if (project.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to update this milestone');
  }
  
  // Check if milestone exists
  const milestone = await milestoneRepository.findById(milestoneId, projectId);
  if (!milestone) {
    return notFound('Milestone not found');
  }
  
  // Add completion timestamp if status is being set to completed
  const updateData: any = { ...data };
  if (data.status === 'COMPLETED' && milestone.status !== 'COMPLETED') {
    updateData.completedAt = new Date().toISOString();
  }
  
  const updated = await milestoneRepository.update(milestoneId, projectId, updateData);
  
  return success(updated);
};

export const handler = withErrorHandler(withAuth(updateMilestoneHandler));
