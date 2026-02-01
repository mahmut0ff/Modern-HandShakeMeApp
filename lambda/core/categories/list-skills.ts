// List all skills Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { validateSafe } from '../shared/utils/validation';
import { requireAuth } from '../shared/middleware/auth';
import { logger } from '../shared/utils/logger';
import { CategoryRepository } from '../shared/repositories/category.repository';

const categoryRepo = new CategoryRepository();

const filterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  search: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  try {
    // Optional authentication - allow public access to skills
    let user = null;
    try {
      user = await requireAuth()(event);
    } catch (error) {
      // Allow unauthenticated access
    }

    logger.info('List skills', { userId: user?.userId });
    
    const result = validateSafe(filterSchema, event.queryStringParameters || {});
    
    if (!result.success) {
      return createErrorResponse(400, 'VALIDATION_ERROR', result.error.errors[0].message);
    }
    
    const { categoryId, search, limit } = result.data;
    
    // Get skills with filters
    const skills = await categoryRepo.listAllSkills({
      categoryId,
      search: search?.toLowerCase(),
      isActive: true,
      limit: limit || 50
    });
    
    logger.info('Skills retrieved', { count: skills.length, categoryId, search });
    
    // Format skills
    const formattedSkills = skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      categoryId: skill.categoryId
    }));
    
    return createResponse(200, {
      skills: formattedSkills,
      count: formattedSkills.length,
      filters: {
        categoryId,
        search,
        limit: limit || 50
      }
    });

  } catch (error) {
    logger.error('List skills error:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to list skills');
  }
};
