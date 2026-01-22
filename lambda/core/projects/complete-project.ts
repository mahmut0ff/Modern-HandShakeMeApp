// Complete project Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const completeProjectSchema = z.object({
  notes: z.string().max(1000).optional()
});

async function completeProjectHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const projectId = event.pathParameters?.id;
  
  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('Complete project', { userId, projectId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(completeProjectSchema, body);
  
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
      order: {
        select: {
          id: true,
          title: true,
          description: true
        }
      }
    },
  });
  
  if (!project) {
    return notFound('Project not found');
  }
  
  // Verify user is master (usually only master can complete)
  const isMaster = project.master.userId === userId;
  
  if (!isMaster) {
    return forbidden('Only the master can complete the project');
  }
  
  // Check if project can be completed
  if (project.status === 'COMPLETED') {
    return badRequest('Project is already completed');
  }
  
  if (project.status === 'CANCELLED') {
    return badRequest('Cannot complete a cancelled project');
  }
  
  // Update project to completed
  const completed = await prisma.project.update({
    where: { id: parseInt(projectId) },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    },
    include: {
      order: {
        select: {
          id: true,
          title: true,
          description: true,
          budgetMin: true,
          budgetMax: true,
          budgetType: true,
          city: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      master: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phone: true
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
              avatar: true,
              phone: true
            }
          }
        }
      }
    }
  });
  
  // Update master's completed projects count
  await prisma.masterProfile.update({
    where: { id: project.masterId },
    data: {
      completedProjectsCount: {
        increment: 1
      }
    }
  });
  
  logger.info('Project completed', { userId, projectId });
  
  // Format response
  const response = {
    id: completed.id,
    orderId: completed.orderId,
    orderTitle: completed.order.title,
    orderDescription: completed.order.description,
    orderBudgetType: completed.order.budgetType,
    orderBudgetMin: completed.order.budgetMin?.toString(),
    orderBudgetMax: completed.order.budgetMax?.toString(),
    orderCity: completed.order.city,
    orderCategory: completed.order.categoryId,
    orderCategoryName: completed.order.category.name,
    master: {
      id: completed.master.user.id,
      name: `${completed.master.user.firstName} ${completed.master.user.lastName}`,
      avatar: completed.master.user.avatar,
      phone: completed.master.user.phone,
      companyName: completed.master.companyName,
      rating: completed.master.rating?.toString()
    },
    client: {
      id: completed.client.user.id,
      name: `${completed.client.user.firstName} ${completed.client.user.lastName}`,
      avatar: completed.client.user.avatar,
      phone: completed.client.user.phone
    },
    price: completed.price?.toString(),
    estimatedDuration: completed.estimatedDuration,
    startDate: completed.startDate,
    status: completed.status,
    notes: data.notes,
    createdAt: completed.createdAt,
    updatedAt: completed.updatedAt,
    completedAt: completed.completedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(completeProjectHandler)));
