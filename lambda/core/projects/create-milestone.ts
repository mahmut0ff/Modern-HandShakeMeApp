import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, notFound, forbidden, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { MilestoneRepository } from '../shared/repositories/milestone.repository';
import { logger } from '../shared/utils/logger';

const projectRepository = new ProjectRepository();
const milestoneRepository = new MilestoneRepository();

const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
  orderNum: z.number().int().nonnegative().optional(),
});

async function createMilestoneHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  const projectId = event.pathParameters?.id;

  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('Create milestone request', { userId, projectId });
  
  const body = JSON.parse(event.body || '{}');
  const validationResult = createMilestoneSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;
  
  const project = await projectRepository.findById(projectId);
  if (!project) {
    return notFound('Project not found');
  }
  
  if (project.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to create milestones for this project');
  }
  
  const milestone = await milestoneRepository.create({
    projectId,
    title: data.title,
    description: data.description,
    amount: data.amount,
    dueDate: data.dueDate,
    orderNum: data.orderNum ?? 0,
    status: 'PENDING',
  });
  
  logger.info('Milestone created', { userId, projectId, milestoneId: milestone.id });
  
  return success(milestone, 201);
}

export const handler = withErrorHandler(withAuth(createMilestoneHandler));
