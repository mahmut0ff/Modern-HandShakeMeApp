// Get my applications Lambda function

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
  status: z.enum(['sent', 'viewed', 'accepted', 'rejected']).optional(),
});

async function getMyApplicationsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get my applications request', { userId });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, status } = result.data;
  
  const prisma = getPrismaClient();
  
  // Get master profile
  const masterProfile = await prisma.masterProfile.findUnique({
    where: { userId },
  });
  
  if (!masterProfile) {
    return paginated([], 0, page, page_size);
  }
  
  // Build where clause
  const where: any = {
    masterId: masterProfile.id,
  };
  
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
          budgetType: true,
          budgetMin: true,
          budgetMax: true,
          status: true,
          city: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
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
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  logger.info('My applications retrieved', { userId, count: applications.length });
  
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
    },
    coverLetter: app.coverLetter,
    proposedPrice: app.proposedPrice?.toString(),
    proposedDurationDays: app.proposedDurationDays,
    status: app.status,
    createdAt: app.createdAt,
    viewedAt: app.viewedAt,
  }));
  
  return paginated(formattedApplications, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getMyApplicationsHandler)));
