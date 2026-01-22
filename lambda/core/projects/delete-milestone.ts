// Delete project milestone

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function deleteMilestoneHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const milestoneId = event.pathParameters?.id;
  
  if (!milestoneId) {
    return notFound('Milestone ID is required');
  }
  
  logger.info('Delete milestone request', { userId, milestoneId });
  
  const prisma = getPrismaClient();
  
  const milestone = await prisma.projectMilestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        include: {
          order: true,
        },
      },
    },
  });
  
  if (!milestone) {
    return notFound('Milestone not found');
  }
  
  // Only client or master can delete milestones
  if (milestone.project.order.clientId !== userId && milestone.project.masterId !== userId) {
    return forbidden('You do not have permission to delete this milestone');
  }
  
  await prisma.projectMilestone.delete({
    where: { id: milestoneId },
  });
  
  return success({ message: 'Milestone deleted successfully' });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(deleteMilestoneHandler)));
