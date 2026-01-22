// Get my orders Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { paginated } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

const filterSchema = paginationSchema.extend({
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
});

async function getMyOrdersHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get my orders request', { userId });
  
  // Parse and validate query parameters
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, status } = result.data;
  
  const prisma = getPrismaClient();
  
  // Get client profile
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
  });
  
  if (!clientProfile) {
    return paginated([], 0, page, page_size);
  }
  
  // Build where clause
  const where: any = {
    clientId: clientProfile.id,
  };
  
  if (status) {
    where.status = status.toUpperCase();
  }
  
  // Get total count
  const total = await prisma.order.count({ where });
  
  // Get orders
  const orders = await prisma.order.findMany({
    where,
    skip: (page - 1) * page_size,
    take: page_size,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      subcategory: {
        select: {
          id: true,
          name: true,
        },
      },
      client: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  logger.info('My orders retrieved successfully', { 
    userId, 
    count: orders.length 
  });
  
  // Format response
  const formattedOrders = orders.map(order => ({
    id: order.id,
    client: {
      id: order.client.user.id,
      name: `${order.client.user.firstName} ${order.client.user.lastName}`,
      avatar: order.client.user.avatar,
      rating: '0.0',
      phone: order.client.user.phone,
    },
    category: order.categoryId,
    categoryName: order.category.name,
    subcategory: order.subcategoryId,
    subcategoryName: order.subcategory?.name,
    requiredSkills: order.requiredSkills || [],
    title: order.title,
    description: order.description,
    city: order.city,
    address: order.address,
    hideAddress: order.hideAddress,
    budgetType: order.budgetType,
    budgetMin: order.budgetMin?.toString(),
    budgetMax: order.budgetMax?.toString(),
    startDate: order.startDate,
    endDate: order.endDate,
    isUrgent: order.isUrgent,
    workVolume: order.workVolume,
    floor: order.floor,
    hasElevator: order.hasElevator,
    materialStatus: order.materialStatus,
    hasElectricity: order.hasElectricity,
    hasWater: order.hasWater,
    canStoreTools: order.canStoreTools,
    hasParking: order.hasParking,
    requiredExperience: order.requiredExperience,
    needTeam: order.needTeam,
    additionalRequirements: order.additionalRequirements,
    isPublic: order.isPublic,
    autoCloseApplications: order.autoCloseApplications,
    status: order.status,
    applicationsCount: order._count.applications,
    viewsCount: 0,
    isFavorite: false,
    hasApplied: false,
    applicationId: null,
    files: [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));
  
  // Response will be automatically transformed
  return paginated(formattedOrders, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getMyOrdersHandler)));
