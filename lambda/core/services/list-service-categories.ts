// List service categories Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function listServiceCategoriesHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('List service categories request received');
  
  const prisma = getPrismaClient();
  
  // Get all service categories
  const categories = await prisma.serviceCategory.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      parent: true,
      is_active: true,
      order_num: true,
    },
    orderBy: {
      order_num: 'asc',
    },
  });
  
  logger.info('Service categories retrieved successfully', { 
    count: categories.length 
  });
  
  return success(categories);
}

export const handler = withErrorHandler(listServiceCategoriesHandler);
