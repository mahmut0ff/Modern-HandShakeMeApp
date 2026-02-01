import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, createErrorResponse } from '../shared/utils/response';
import { CategoryRepository } from '../shared/repositories/category.repository';
import { logger } from '../shared/utils/logger';

const categoryRepo = new CategoryRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('List categories request');

    // Ensure categories are seeded
    await categoryRepo.seedCategories();

    // Get active categories ordered by order field
    const categories = await categoryRepo.listCategories({
      isActive: true
    });

    // Format response
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      order: category.order
    }));

    logger.info('Categories retrieved', { count: formattedCategories.length });

    return createResponse(200, formattedCategories);

  } catch (error) {
    logger.error('List categories error:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to list categories');
  }
};
