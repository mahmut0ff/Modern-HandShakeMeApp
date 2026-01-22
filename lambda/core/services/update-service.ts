// Update service Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, notFound, forbidden, conflict } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const updateServiceSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  priceFrom: z.number().positive().optional(),
  priceTo: z.number().positive().optional(),
  unit: z.enum(['hour', 'project', 'sqm', 'piece', 'day']).optional(),
  categoryId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  orderNum: z.number().int().optional()
});

async function updateServiceHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const serviceId = event.pathParameters?.id;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can update services');
  }
  
  if (!serviceId) {
    return badRequest('Service ID is required');
  }
  
  logger.info('Update service request', { userId, serviceId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(updateServiceSchema, body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  const prisma = getPrismaClient();
  
  // Check if service exists and belongs to the master
  const existingService = await prisma.masterService.findFirst({
    where: {
      id: parseInt(serviceId),
      masterId: userId
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
  
  if (!existingService) {
    return notFound('Service not found or access denied');
  }
  
  // Validate price range if both prices are provided
  const newPriceFrom = data.priceFrom ?? Number(existingService.priceFrom);
  const newPriceTo = data.priceTo ?? Number(existingService.priceTo);
  
  if (newPriceTo < newPriceFrom) {
    return badRequest('Price "to" must be greater than or equal to price "from"');
  }
  
  // Check if category exists (if being updated)
  if (data.categoryId) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId }
    });
    
    if (!category) {
      return notFound('Service category not found');
    }
  }
  
  // Check for name conflicts (if name is being updated)
  if (data.name && data.name !== existingService.name) {
    const nameConflict = await prisma.masterService.findFirst({
      where: {
        masterId: userId,
        name: data.name,
        id: { not: parseInt(serviceId) }
      }
    });
    
    if (nameConflict) {
      return conflict('Service with this name already exists');
    }
  }
  
  // Update the service
  const updatedService = await prisma.masterService.update({
    where: { id: parseInt(serviceId) },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priceFrom && { priceFrom: data.priceFrom }),
      ...(data.priceTo && { priceTo: data.priceTo }),
      ...(data.unit && { unit: data.unit }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.orderNum !== undefined && { order_num: data.orderNum })
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
  
  logger.info('Service updated successfully', { serviceId, userId });
  
  const response = {
    id: updatedService.id,
    masterId: updatedService.masterId,
    name: updatedService.name,
    description: updatedService.description,
    priceFrom: updatedService.priceFrom.toString(),
    priceTo: updatedService.priceTo?.toString(),
    unit: updatedService.unit,
    categoryId: updatedService.categoryId,
    categoryName: updatedService.category.name,
    isActive: updatedService.isActive,
    isFeatured: updatedService.isFeatured || false,
    orderNum: updatedService.order_num || 0,
    createdAt: updatedService.createdAt,
    updatedAt: updatedService.updatedAt
  };
  
  return success(response);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateServiceHandler)));
