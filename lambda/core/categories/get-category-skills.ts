// Get category skills Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { validateInput } from '../shared/utils/validation';
import { requireAuth } from '../shared/middleware/auth';
import { logger } from '../shared/utils/logger';
import { CategoryRepository } from '../shared/repositories/category.repository';

const categoryRepo = new CategoryRepository();

// Validation schema
const getCategorySkillsSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID')
});

export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  try {
    // Optional authentication - allow public access to categories/skills
    let user = null;
    try {
      user = await requireAuth()(event);
    } catch (error) {
      // Allow unauthenticated access
    }

    const categoryId = event.pathParameters?.categoryId;
    
    if (!categoryId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Category ID is required');
    }

    // Validate categoryId format
    const validationResult = z.string().uuid().safeParse(categoryId);
    if (!validationResult.success) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid category ID format');
    }
    
    logger.info('Get category skills', { categoryId, userId: user?.userId });
    
    // Check if category exists
    const category = await categoryRepo.getCategory(categoryId);
    
    if (!category) {
      return createErrorResponse(404, 'NOT_FOUND', 'Category not found');
    }

    if (!category.isActive) {
      return createErrorResponse(404, 'NOT_FOUND', 'Category is not active');
    }
    
    // Get skills for this category
    const skills = await categoryRepo.getCategorySkills(categoryId, {
      isActive: true
    });
    
    logger.info('Category skills retrieved', { 
      categoryId, 
      count: skills.length 
    });
    
    // Format skills
    const formattedSkills = skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      categoryId: skill.categoryId
    }));
    
    return createResponse(200, {
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon
      },
      skills: formattedSkills,
      count: formattedSkills.length
    });

  } catch (error) {
    logger.error('Get category skills error:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get category skills');
  }
};
