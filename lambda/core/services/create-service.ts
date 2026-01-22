// Create service Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { serviceSchema, validateSafe } from '@/shared/utils/validation';
import { success, badRequest, notFound, conflict } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function createServiceHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return badRequest('Only masters can create services');
  }

  logger.info('Create service request', { userId });

  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(serviceSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();

  // Check if category exists
  const category = await prisma.serviceCategory.findUnique({
    where: { id: data.category }
  });

  if (!category) {
    return notFound('Service category not found');
  }

  // Check if master already has a service with the same name
  const existingService = await prisma.masterService.findFirst({
    where: {
      masterId: userId,
      name: data.name
    }
  });

  if (existingService) {
    return conflict('Service with this name already exists');
  }

  // Create the service
  const service = await prisma.masterService.create({
    data: {
      masterId: userId,
      name: data.name,
      description: data.description,
      priceFrom: data.priceFrom,
      priceTo: data.priceTo || data.priceFrom,
      unit: data.unit,
      categoryId: data.category,
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info('Service created successfully', { serviceId: service.id, userId });

  const response = {
    id: service.id,
    master: service.masterId,
    name: service.name,
    description: service.description,
    category: service.categoryId,
    categoryName: service.category.name,
    priceFrom: service.priceFrom.toString(),
    priceTo: service.priceTo.toString(),
    unit: service.unit,
    isActive: service.isActive,
    isFeatured: service.isFeatured,
    orderNum: service.order_num || 0,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };

  return success(response, { statusCode: 201 });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(createServiceHandler)));
