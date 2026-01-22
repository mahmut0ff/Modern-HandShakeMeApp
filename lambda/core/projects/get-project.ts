// Get project by ID Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden, notFound, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getProjectHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const projectId = event.pathParameters?.id;
  
  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('Get project', { userId, projectId });
  
  const prisma = getPrismaClient();
  
  const project = await prisma.project.findUnique({
    where: { id: parseInt(projectId) },
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
        },
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
            },
          },
        },
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
            },
          },
        },
      },
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
  
  logger.info('Project retrieved', { userId, projectId });
  
  // Format response
  const response = {
    id: project.id,
    orderId: project.orderId,
    orderTitle: project.order.title,
    orderDescription: project.order.description,
    orderBudgetType: project.order.budgetType,
    orderBudgetMin: project.order.budgetMin?.toString(),
    orderBudgetMax: project.order.budgetMax?.toString(),
    orderCity: project.order.city,
    orderCategory: project.order.categoryId,
    orderCategoryName: project.order.category.name,
    master: {
      id: project.master.user.id,
      name: `${project.master.user.firstName} ${project.master.user.lastName}`,
      avatar: project.master.user.avatar,
      phone: project.master.user.phone,
      companyName: project.master.companyName,
      rating: project.master.rating?.toString()
    },
    client: {
      id: project.client.user.id,
      name: `${project.client.user.firstName} ${project.client.user.lastName}`,
      avatar: project.client.user.avatar,
      phone: project.client.user.phone
    },
    price: project.price?.toString(),
    estimatedDuration: project.estimatedDuration,
    startDate: project.startDate,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    completedAt: project.completedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getProjectHandler)));
