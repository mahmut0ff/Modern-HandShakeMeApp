// List project milestones

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function listMilestonesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const projectId = event.pathParameters?.id;
  
  if (!projectId) {
    return notFound('Project ID is required');
  }
  
  logger.info('List milestones request', { userId, projectId });
  
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
  
  // Only client or master can view milestones
  if (project.order.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to view milestones for this project');
  }
  
  const milestones = await prisma.projectMilestone.findMany({
    where: { projectId },
    orderBy: { orderNum: 'asc' },
  });
  
  return success(milestones);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(listMilestonesHandler)));
