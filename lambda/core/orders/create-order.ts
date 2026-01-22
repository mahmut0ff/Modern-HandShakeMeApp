// Create order Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { publishEvent } from '@/shared/events/publisher';
import { orderSchema, validate } from '@/shared/utils/validation';
import { success, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { convertEnumsToUppercase } from '@/shared/utils/enum-converter';
import { logger } from '@/shared/utils/logger';
import { EventType } from '@/shared/types';

async function createOrderHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can create orders');
  }
  
  logger.info('Create order request', { userId });
  
  // Request is already transformed by withRequestTransform middleware
  const body = JSON.parse(event.body || '{}');
  const data = validate(orderSchema, body);
  
  const prisma = getPrismaClient();
  
  // Get or create client profile
  let clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
  });
  
  if (!clientProfile) {
    clientProfile = await prisma.clientProfile.create({
      data: { userId },
    });
  }
  
  // Convert enums to UPPERCASE for database
  const dbData = convertEnumsToUppercase({
    budgetType: data.budgetType,
    materialStatus: data.materialStatus,
  });
  
  // Create order
  const order = await prisma.order.create({
    data: {
      clientId: clientProfile.id,
      title: data.title,
      description: data.description,
      categoryId: data.category,
      subcategoryId: data.subcategory || null,
      requiredSkills: data.requiredSkills || [],
      city: data.city,
      address: data.address || null,
      hideAddress: data.hideAddress || true,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isUrgent: data.isUrgent || false,
      workVolume: data.workVolume || null,
      floor: data.floor || null,
      hasElevator: data.hasElevator || null,
      materialStatus: dbData.materialStatus as any,
      hasElectricity: data.hasElectricity || null,
      hasWater: data.hasWater || null,
      canStoreTools: data.canStoreTools || null,
      hasParking: data.hasParking || null,
      requiredExperience: data.requiredExperience || null,
      needTeam: data.needTeam || false,
      additionalRequirements: data.additionalRequirements || null,
      budgetType: dbData.budgetType as any,
      budgetMin: data.budgetMin || null,
      budgetMax: data.budgetMax || null,
      isPublic: data.isPublic !== false,
      autoCloseApplications: data.autoCloseApplications !== false,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
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
            },
          },
        },
      },
    },
  });
  
  // Publish order.created event
  await publishEvent(
    EventType.ORDER_CREATED,
    userId,
    {
      orderId: order.id,
      categoryId: order.categoryId,
      budgetMin: order.budgetMin,
      budgetMax: order.budgetMax,
      city: order.city,
    }
  );
  
  logger.info('Order created successfully', { userId, orderId: order.id });
  
  // Response will be automatically transformed by success() helper
  const response = {
    id: order.id,
    client: {
      id: order.client.user.id,
      name: `${order.client.user.firstName} ${order.client.user.lastName}`,
      avatar: null,
      rating: '0.0',
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
    applicationsCount: 0,
    viewsCount: 0,
    isFavorite: false,
    hasApplied: false,
    applicationId: null,
    files: [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
  
  return success(response, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(createOrderHandler)));
