// List project milestones

import { APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { MilestoneRepository } from '../shared/repositories/milestone.repository';

const projectRepository = new ProjectRepository();
const milestoneRepository = new MilestoneRepository();

const listMilestonesHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  const projectId = event.pathParameters?.id;
  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('List milestones request', { userId, projectId });
  
  // Get project to verify ownership
  const project = await projectRepository.findById(projectId);
  if (!project) {
    return notFound('Project not found');
  }
  
  // Only client or master can view milestones
  if (project.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to view milestones for this project');
  }
  
  const milestones = await milestoneRepository.findByProject(projectId);
  
  return success(milestones);
};

export const handler = withErrorHandler(withAuth(listMilestonesHandler));
