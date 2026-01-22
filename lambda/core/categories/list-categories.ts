// List categories Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function listCategoriesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  logger.info('List categories');
  
  const prisma = getPrismaClient();
  
  // Get all active categories
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      parent: true,
      icon: true,
      orderNum: true,
    },
    orderBy: {
      orderNum: 'asc',
    },
  });
  
  logger.info('Categories retrieved', { count: categories.length });
  
  // Build hierarchical structure
  const categoryMap = new Map();
  const rootCategories: any[] = [];
  
  // First pass: create all categories
  categories.forEach(category => {
    const formattedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent: category.parent,
      icon: category.icon,
      children: [],
    };
    categoryMap.set(category.id, formattedCategory);
    
    if (!category.parent) {
      rootCategories.push(formattedCategory);
    }
  });
  
  // Second pass: build parent-child relationships
  categories.forEach(category => {
    if (category.parent) {
      const parent = categoryMap.get(category.parent);
      const child = categoryMap.get(category.id);
      if (parent && child) {
        parent.children.push(child);
      }
    }
  });
  
  return success({ results: rootCategories });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(listCategoriesHandler)));
