// Toggle service status Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function toggleServiceStatusHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const serviceId = event.pathParameters?.id;
  
  if (!serviceId) {
    return notFound('Service ID is required');
  }
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can toggle service status');
  }
  
  logger.info('Toggle service status request', { userId, serviceId });
  
  const prisma = getPrismaClient();
  
  // Get service and verify ownership
  const service = await prisma.masterService.findUnique({
    where: { id: parseInt(serviceId) },
  });
  
  if (!service) {
    return notFound('Service not found');
  }
  
  if (service.masterId !== userId) {
    return forbidden('You can only toggle your own services');
  }
  
  // Toggle status
  const updatedService = await prisma.masterService.update({
    where: { id: parseInt(serviceId) },
    data: {
      isActive: !service.isActive,
      updatedAt: new Date(),
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  logger.info('Service status toggled successfully', { 
    userId, 
    serviceId, 
    newStatus: updatedService.isActive 
  });
  
  // Format response
  const response = {
    id: updatedService.id,
    master: updatedService.masterId,
    name: updatedService.name,
    description: updatedService.description,
    category: updatedService.categoryId,
    category_name: updatedService.category.name,
    price_from: updatedService.priceFrom.toString(),
    price_to: updatedService.priceTo?.toString(),
    unit: updatedService.unit.toLowerCase(),
    is_active: updatedService.isActive,
    is_featured: updatedService.isFeatured || false,
    order_num: updatedService.order_num || 0,
    created_at: updatedService.createdAt.toISOString(),
    updated_at: updatedService.updatedAt.toISOString(),
  };
  
  return success(response);
}

export const handler = withErrorHandler(withAuth(toggleServiceStatusHandler));
