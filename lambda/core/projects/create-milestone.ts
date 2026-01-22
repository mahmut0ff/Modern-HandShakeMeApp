// Create project milestone

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
  orderNum: z.number().int().nonnegative().optional(),
});

async function createMilestoneHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const projectId = event.pathParameters?.id;
  
  if (!projectId) {
    return notFound('Project ID is required');
  }
  
  logger.info('Create milestone request', { userId, projectId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(createMilestoneSchema, body);
  
  const prisma = getPrismaClient();
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      order: true,
    },
  });
  
  if (!project) {
    return notFound('Project not found');
  }
  
  // Only client or master can create milestones
  if (project.order.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to create milestones for this project');
  }
  
  const milestone = await prisma.projectMilestone.create({
    data: {
      projectId,
      title: data.title,
      description: data.description,
      amount: data.amount,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      orderNum: data.orderNum ?? 0,
      status: 'PENDING',
    },
  });
  
  return success(milestone, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(createMilestoneHandler)));
