// List applications for an order Lambda function

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
  orderId: z.coerce.number().int().positive().optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn']).optional(),
});

async function listApplicationsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('List applications request', { userId, userRole });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, orderId, status } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause based on user role
  const where: any = {};
  
  if (userRole === 'MASTER') {
    // Masters see their own applications
    const masterProfile = await prisma.masterProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    
    if (!masterProfile) {
      return paginated([], 0, page, page_size);
    }
    
    where.masterId = masterProfile.id;
  } else if (userRole === 'CLIENT') {
    // Clients see applications to their orders
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    
    if (!clientProfile) {
      return paginated([], 0, page, page_size);
    }
    
    where.order = {
      clientId: clientProfile.id
    };
  }
  
  // Add additional filters
  if (orderId) {
    where.orderId = orderId;
  }
  
  if (status) {
    where.status = status.toUpperCase();
  }
  
  // Get total count
  const total = await prisma.application.count({ where });
  
  // Get applications
  const applications = await prisma.application.findMany({
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
          status: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true
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
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  logger.info('Applications retrieved', { userId, count: applications.length });
  
  // Format applications
  const formattedApplications = applications.map(app => ({
    id: app.id,
    orderId: app.orderId,
    orderTitle: app.order.title,
    orderDescription: app.order.description,
    orderBudgetType: app.order.budgetType,
    orderBudgetMin: app.order.budgetMin?.toString(),
    orderBudgetMax: app.order.budgetMax?.toString(),
    orderStatus: app.order.status,
    orderCity: app.order.city,
    orderCategory: app.order.categoryId,
    orderCategoryName: app.order.category.name,
    master: {
      id: app.master.user.id,
      name: `${app.master.user.firstName} ${app.master.user.lastName}`,
      avatar: app.master.user.avatar,
      companyName: app.master.companyName,
      rating: app.master.rating?.toString(),
      reviewsCount: app.master.reviewsCount,
      completedProjects: app.master.completedProjectsCount,
      category: app.master.category?.name,
      city: app.master.city
    },
    proposal: app.proposal,
    price: app.price?.toString(),
    estimatedDuration: app.estimatedDuration,
    coverLetter: app.coverLetter,
    status: app.status,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt
  }));
  
  return paginated(formattedApplications, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(listApplicationsHandler)));
