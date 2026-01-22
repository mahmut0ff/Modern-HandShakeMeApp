// Get my services Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { paginated, forbidden } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  isActive: z.enum(['true', 'false']).optional(),
});

async function getMyServicesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can access their services');
  }
  
  logger.info('Get my services request', { userId });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, isActive } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {
    masterId: userId,
  };
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  // Get total count
  const total = await prisma.masterService.count({ where });
  
  // Get master's services
  const services = await prisma.masterService.findMany({
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
    },
    orderBy: {
      order_num: 'asc',
    },
  });
  
  logger.info('Master services retrieved', { 
    userId, 
    count: services.length 
  });
  
  // Format services
  const formattedServices = services.map(service => ({
    id: service.id,
    master: service.masterId,
    name: service.name,
    description: service.description,
    category: service.categoryId,
    categoryName: service.category.name,
    priceFrom: service.priceFrom.toString(),
    priceTo: service.priceTo?.toString(),
    unit: service.unit,
    isActive: service.isActive,
    isFeatured: service.isFeatured || false,
    orderNum: service.order_num || 0,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }));
  
  return paginated(formattedServices, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getMyServicesHandler)));
