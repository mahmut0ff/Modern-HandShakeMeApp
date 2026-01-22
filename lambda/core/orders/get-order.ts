// Get order by ID

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { cache } from '@/shared/cache/client';
import { success, notFound } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getOrderHandler(
  event: any
): Promise<APIGatewayProxyResult> {
  const orderId = event.pathParameters?.id;
  
  if (!orderId) {
    return notFound('Order ID is required');
  }
  
  logger.info('Get order', { orderId });
  
  // Try cache first
  const cacheKey = `order:${orderId}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.info('Order from cache', { orderId });
    return success(cached);
  }
  
  const prisma = getPrismaClient();
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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
              avatar: true,
              phone: true,
            },
          },
        },
      },
      applications: {
        select: {
          id: true,
          status: true,
          price: true,
          proposal: true,
          createdAt: true,
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
      },
      project: {
        select: {
          id: true,
          status: true,
          progressPercentage: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });
  
  if (!order) {
    return notFound('Order not found');
  }
  
  // Format response
  const formattedOrder = {
    id: order.id,
    client: {
      id: order.client.user.id,
      name: `${order.client.user.firstName} ${order.client.user.lastName}`,
      avatar: order.client.user.avatar,
      phone: order.client.user.phone,
    },
    category: order.categoryId,
    categoryName: order.category.name,
    subcategory: order.subcategoryId,
    subcategoryName: order.subcategory?.name,
    requiredSkills: order.requiredSkills,
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
    applications: order.applications.map(app => ({
      id: app.id,
      status: app.status,
      price: app.price?.toString(),
      proposal: app.proposal,
      createdAt: app.createdAt,
      master: {
        id: app.master.user.id,
        name: `${app.master.user.firstName} ${app.master.user.lastName}`,
        avatar: app.master.user.avatar,
      },
    })),
    project: order.project ? {
      id: order.project.id,
      status: order.project.status,
      progressPercentage: order.project.progressPercentage,
    } : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    expiresAt: order.expiresAt,
  };
  
  // Cache for 5 minutes
  await cache.set(cacheKey, formattedOrder, 300);
  
  // Response will be automatically transformed
  return success(formattedOrder);
}

export const handler = withErrorHandler(withRequestTransform(getOrderHandler));
