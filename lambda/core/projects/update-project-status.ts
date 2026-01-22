// Update project status Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const updateStatusSchema = z.object({
  status: z.enum(['in_progress', 'review', 'revision', 'completed', 'cancelled']),
  notes: z.string().max(1000).optional(),
});

// Status transition rules
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  IN_PROGRESS: ['REVIEW', 'CANCELLED'],
  REVIEW: ['REVISION', 'COMPLETED', 'CANCELLED'],
  REVISION: ['REVIEW', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

async function updateProjectStatusHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const projectId = event.pathParameters?.id;
  
  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('Update project status', { userId, projectId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(updateStatusSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  // Get project
  const project = await prisma.project.findUnique({
    where: { id: parseInt(projectId) },
    include: {
      master: { include: { user: true } },
      client: { include: { user: true } },
    },
  });
  
  if (!project) {
    return notFound('Project not found');
  }
  
  // Verify user is participant
  const isMaster = project.master.userId === userId;
  const isClient = project.client.userId === userId;
  
  if (!isMaster && !isClient) {
    return forbidden('You are not a participant in this project');
  }
  
  // Validate status transition
  const allowedStatuses = ALLOWED_TRANSITIONS[project.status] || [];
  const upperStatus = data.status.toUpperCase();
  
  if (!allowedStatuses.includes(upperStatus)) {
    return forbidden(`Cannot transition from ${project.status} to ${upperStatus}`);
  }
  
  // Update project
  const updated = await prisma.project.update({
    where: { id: parseInt(projectId) },
    data: {
      status: upperStatus,
      ...(upperStatus === 'COMPLETED' && { completedAt: new Date() }),
    },
    include: {
      order: {
        select: {
          id: true,
          title: true
        }
      },
      master: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      },
      client: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  });
  
  logger.info('Project status updated', { userId, projectId, status: upperStatus });
  
  // Format response
  const response = {
    id: updated.id,
    orderId: updated.orderId,
    orderTitle: updated.order.title,
    master: {
      id: updated.master.user.id,
      name: `${updated.master.user.firstName} ${updated.master.user.lastName}`,
      avatar: updated.master.user.avatar
    },
    client: {
      id: updated.client.user.id,
      name: `${updated.client.user.firstName} ${updated.client.user.lastName}`,
      avatar: updated.client.user.avatar
    },
    price: updated.price?.toString(),
    estimatedDuration: updated.estimatedDuration,
    startDate: updated.startDate,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    completedAt: updated.completedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateProjectStatusHandler)));
