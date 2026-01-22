// Get my projects Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { paginated } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  status: z.enum(['in_progress', 'review', 'revision', 'completed', 'cancelled']).optional(),
});

async function getMyProjectsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('Get my projects request', { userId, userRole });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, status } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause based on user role
  const where: any = {};
  
  if (userRole === 'MASTER') {
    const masterProfile = await prisma.masterProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    
    if (!masterProfile) {
      return paginated([], 0, page, page_size);
    }
    
    where.masterId = masterProfile.id;
  } else if (userRole === 'CLIENT') {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    
    if (!clientProfile) {
      return paginated([], 0, page, page_size);
    }
    
    where.clientId = clientProfile.id;
  }
  
  if (status) {
    where.status = status.toUpperCase();
  }
  
  // Get total count
  const total = await prisma.project.count({ where });
  
  // Get projects
  const projects = await prisma.project.findMany({
    where,
    skip: (page - 1) * page_size,
    take: page_size,
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  logger.info('Projects retrieved', { userId, count: projects.length });
  
  // Format projects
  const formattedProjects = projects.map(project => ({
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
  }));
  
  return paginated(formattedProjects, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getMyProjectsHandler)));
