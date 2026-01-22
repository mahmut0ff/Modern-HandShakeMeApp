// Get category skills Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, notFound, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function getCategorySkillsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const categoryId = event.pathParameters?.categoryId;
  
  if (!categoryId) {
    return badRequest('Category ID is required');
  }
  
  logger.info('Get category skills', { categoryId });
  
  const prisma = getPrismaClient();
  
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: parseInt(categoryId) },
  });
  
  if (!category) {
    return notFound('Category not found');
  }
  
  // Get skills for this category
  const skills = await prisma.skill.findMany({
    where: {
      categoryId: parseInt(categoryId),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      categoryId: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  
  logger.info('Category skills retrieved', { 
    categoryId, 
    count: skills.length 
  });
  
  // Format skills
  const formattedSkills = skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    category: skill.categoryId
  }));
  
  return success(formattedSkills);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(getCategorySkillsHandler)));
