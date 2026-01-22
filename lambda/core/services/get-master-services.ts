// Get specific master's services Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getMasterServicesHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const masterId = event.pathParameters?.id;
  
  if (!masterId) {
    return notFound('Master ID is required');
  }
  
  logger.info('Get master services request', { masterId });
  
  const prisma = getPrismaClient();
  
  // Check if master exists
  const master = await prisma.user.findUnique({
    where: { id: masterId },
  });
  
  if (!master || master.role !== 'MASTER') {
    return notFound('Master not found');
  }
  
  // Get master's services
  const services = await prisma.masterService.findMany({
    where: {
      masterId,
      isActive: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      order_num: 'asc',
    },
  });
  
  logger.info('Master services retrieved successfully', { 
    masterId, 
    count: services.length 
  });
  
  // Format response
  const response = services.map(service => ({
    id: service.id,
    master: service.masterId,
    name: service.name,
    description: service.description,
    category: service.categoryId,
    category_name: service.category.name,
    price_from: service.priceFrom.toString(),
    price_to: service.priceTo?.toString(),
    unit: service.unit.toLowerCase(),
    unit_display: getUnitDisplay(service.unit.toLowerCase()),
    is_active: service.isActive,
    is_featured: service.isFeatured || false,
    order_num: service.order_num || 0,
    created_at: service.createdAt.toISOString(),
    updated_at: service.updatedAt.toISOString(),
  }));
  
  return success(response);
}

function getUnitDisplay(unit: string): string {
  const unitDisplayMap: Record<string, string> = {
    'hour': 'час',
    'sqm': 'м²',
    'piece': 'шт',
    'project': 'проект',
    'day': 'день',
  };
  return unitDisplayMap[unit] || unit;
}

export const handler = withErrorHandler(getMasterServicesHandler);
