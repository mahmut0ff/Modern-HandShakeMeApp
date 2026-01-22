// List orders with filters and pagination

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { cache } from '@/shared/cache/client';
import { paginated } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  category: z.number().int().positive().optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  search: z.string().optional(),
  minBudget: z.coerce.number().positive().optional(),
  maxBudget: z.coerce.number().positive().optional(),
});

async function listOrdersHandler(
  event: any
): Promise<APIGatewayProxyResult> {
  logger.info('List orders request');
  
  // Request is already transformed by withRequestTransform middleware
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return paginated([], 0, 1, 20);
  }
  
  const { page, page_size, sort_by, order, category, status, search, minBudget, maxBudget } = result.data;
  
  // Generate cache key
  const cacheKey = `orders:${JSON.stringify({ page, page_size, category, status, search, minBudget, maxBudget })}`;
  
  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.info('Orders from cache');
    return paginated(cached.results, cached.count, page, page_size);
  }
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {
    ...(category && { categoryId: category }),
    ...(status && { status: status.toUpperCase() }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(minBudget && { budgetMin: { gte: minBudget } }),
    ...(maxBudget && { budgetMax: { lte: maxBudget } }),
  };
  
  // Get total count
  const total = await prisma.order.count({ where });
  
  // Get orders
  const orders = await prisma.order.findMany({
    where,
    skip: (page - 1) * page_size,
    take: page_size,
    orderBy: sort_by ? { [sort_by]: order } : { createdAt: 'desc' },
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
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });
  
  // Format orders
  const formattedOrders = orders.map(order => ({
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
    title: order.title,
    description: order.description,
    city: order.city,
    budgetType: order.budgetType,
    budgetMin: order.budgetMin?.toString(),
    budgetMax: order.budgetMax?.toString(),
    status: order.status,
    applicationsCount: order._count.applications,
    isUrgent: order.isUrgent,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));
  
  // Cache for 1 minute
  await cache.set(cacheKey, { results: formattedOrders, count: total }, 60);
  
  // Response will be automatically transformed
  return paginated(formattedOrders, total, page, page_size);
}

export const handler = withErrorHandler(withRequestTransform(listOrdersHandler));
