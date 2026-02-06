// Delete project milestone

import { APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { MilestoneRepository } from '../shared/repositories/milestone.repository';

const projectRepository = new ProjectRepository();
const milestoneRepository = new MilestoneRepository();

const deleteMilestoneHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  const milestoneId = event.pathParameters?.id;
  const projectId = event.pathParameters?.projectId;
  
  if (!milestoneId) {
    return badRequest('Milestone ID is required');
  }

  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('Delete milestone request', { userId, milestoneId, projectId });
  
  // Get project to verify ownership
  const project = await projectRepository.findById(projectId);
  if (!project) {
    return notFound('Project not found');
  }
  
  // Only client or master can delete milestones
  if (project.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to delete this milestone');
  }
  
  // Check if milestone exists
  const milestone = await milestoneRepository.findById(milestoneId, projectId);
  if (!milestone) {
    return notFound('Milestone not found');
  }
  
  await milestoneRepository.delete(milestoneId, projectId);
  
  return success({ message: 'Milestone deleted successfully' });
};

export const handler = withErrorHandler(withAuth(deleteMilestoneHandler));
