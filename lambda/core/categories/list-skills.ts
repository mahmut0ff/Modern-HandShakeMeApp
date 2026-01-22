// List all skills Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

const filterSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

async function listSkillsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  logger.info('List skills');
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return success([]);
  }
  
  const { categoryId, search } = result.data;
  
  const prisma = getPrismaClient();
  
  // Build where clause
  const where: any = {
    isActive: true,
  };
  
  if (categoryId) {
    where.categoryId = categoryId;
  }
  
  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive'
    };
  }
  
  // Get skills
  const skills = await prisma.skill.findMany({
    where,
    select: {
      id: true,
      name: true,
      categoryId: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  
  logger.info('Skills retrieved', { count: skills.length });
  
  // Format skills
  const formattedSkills = skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    category: skill.categoryId
  }));
  
  return success(formattedSkills);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(listSkillsHandler)));
