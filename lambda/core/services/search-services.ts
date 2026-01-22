// Search services Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function searchServicesHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const params = event.queryStringParameters || {};
  const {
    category,
    city,
    min_price,
    max_price,
    unit,
    search,
    ordering = '-created_at',
    page = '1',
  } = params;
  
  logger.info('Search services request', { params });
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {
    isActive: true,
  };
  
  if (category) {
    where.categoryId = parseInt(category);
  }
  
  if (min_price) {
    where.priceFrom = { gte: parseFloat(min_price) };
  }
  
  if (max_price) {
    where.priceTo = { lte: parseFloat(max_price) };
  }
  
  if (unit) {
    where.unit = unit.toUpperCase();
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  // Build order by
  const orderBy: any = {};
  if (ordering.startsWith('-')) {
    orderBy[ordering.slice(1)] = 'desc';
  } else {
    orderBy[ordering] = 'asc';
  }
  
  // Pagination
  const pageNum = parseInt(page);
  const limit = 20;
  const skip = (pageNum - 1) * limit;
  
  // Get services
  const [services, total] = await Promise.all([
    prisma.masterService.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
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
            masterProfile: {
              select: {
                rating: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.masterService.count({ where }),
  ]);
  
  logger.info('Services search completed', { 
    count: services.length,
    total,
  });
  
  // Format response
  const results = services.map(service => ({
    id: service.id,
    master_id: service.masterId,
    name: service.name,
    description: service.description,
    category_id: service.categoryId,
    category: {
      id: service.category.id,
      name: service.category.name,
      slug: service.category.slug,
    },
    master: {
      id: service.master.user.id,
      user: {
        first_name: service.master.user.firstName,
        last_name: service.master.user.lastName,
        avatar: service.master.user.avatar,
      },
      rating: service.master.masterProfile?.rating || 0,
      city: service.master.masterProfile?.city,
    },
    price_from: service.priceFrom.toString(),
    price_to: service.priceTo?.toString(),
    unit: service.unit.toLowerCase(),
    is_active: service.isActive,
    created_at: service.createdAt.toISOString(),
    updated_at: service.updatedAt.toISOString(),
  }));
  
  return success({
    results,
    count: total,
    page: pageNum,
    pages: Math.ceil(total / limit),
  });
}

export const handler = withErrorHandler(searchServicesHandler);
