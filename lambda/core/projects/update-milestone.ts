// Update project milestone

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validateSafe } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  orderNum: z.number().int().nonnegative().optional(),
});

async function updateMilestoneHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const milestoneId = event.pathParameters?.id;
  
  if (!milestoneId) {
    return notFound('Milestone ID is required');
  }
  
  logger.info('Update milestone request', { userId, milestoneId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(updateMilestoneSchema, body);
  
  if (!result.success) {
    return forbidden('Invalid data');
  }
  
  const data = result.data;
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
  
  // Only client or master can update milestones
  if (milestone.project.order.clientId !== userId && milestone.project.masterId !== userId) {
    return forbidden('You do not have permission to update this milestone');
  }
  
  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount) updateData.amount = data.amount;
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
  if (data.status) updateData.status = data.status;
  if (data.orderNum !== undefined) updateData.orderNum = data.orderNum;
  
  const updated = await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: updateData,
  });
  
  return success(updated);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateMilestoneHandler)));
