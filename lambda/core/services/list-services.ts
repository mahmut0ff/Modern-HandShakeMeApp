// List services Lambda function

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
  masterId: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

async function listServicesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('List services request', { userId });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, masterId, categoryId, isActive } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {};
  
  if (masterId) {
    where.masterId = masterId;
  }
  
  if (categoryId) {
    where.categoryId = categoryId;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  // Get total count
  const total = await prisma.masterService.count({ where });
  
  // Get services
  const services = await prisma.masterService.findMany({
    where,
    skip: (page - 1) * page_size,
    take: page_size,
    include: {
      category: {
        select: {
          id: true,
          name: true
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
          }
        }
      }
    },
    orderBy: [
      { isActive: 'desc' },
      { createdAt: 'desc' }
    ]
  });
  
  logger.info('Services retrieved', { count: services.length });
  
  // Format services
  const formattedServices = services.map(service => ({
    id: service.id,
    masterId: service.masterId,
    masterName: `${service.master.user.firstName} ${service.master.user.lastName}`,
    masterAvatar: service.master.user.avatar,
    masterCompanyName: service.master.companyName,
    masterRating: service.master.rating?.toString(),
    name: service.name,
    description: service.description,
    priceFrom: service.priceFrom.toString(),
    priceTo: service.priceTo?.toString(),
    unit: service.unit,
    categoryId: service.categoryId,
    categoryName: service.category.name,
    isActive: service.isActive,
    isFeatured: service.isFeatured || false,
    orderNum: service.order_num || 0,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt
  }));
  
  return paginated(formattedServices, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(listServicesHandler)));
