// List project payments

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function listProjectPaymentsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const projectId = event.pathParameters?.id;
  
  if (!projectId) {
    return notFound('Project ID is required');
  }
  
  logger.info('List project payments request', { userId, projectId });
  
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
  
  // Only client or master can view payments
  if (project.order.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to view payments for this project');
  }
  
  const payments = await prisma.transaction.findMany({
    where: {
      projectId,
      type: { in: ['PAYMENT', 'REFUND', 'ESCROW'] },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return success(payments);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(listProjectPaymentsHandler)));
