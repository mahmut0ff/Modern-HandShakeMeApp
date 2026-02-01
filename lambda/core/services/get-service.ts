// Get single service Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceRepository, ServiceCategoryRepository } from '../shared/repositories/service.repository';
import { successResponse, notFoundResponse, badRequestResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const serviceId = event.pathParameters?.id;
    
    if (!serviceId) {
      return badRequestResponse('Service ID is required');
    }
    
    logger.info('Get service request', { serviceId });
    
    const serviceRepository = new ServiceRepository();
    const service = await serviceRepository.findById(serviceId);
    
    if (!service) {
      return notFoundResponse('Service not found');
    }
    
    // Increment view count
    await serviceRepository.incrementViews(serviceId);
    
    // Get category information
    const categoryRepository = new ServiceCategoryRepository();
    const category = await categoryRepository.findById(service.categoryId);
    
    // Format service with category info
    const formattedService = {
      ...service,
      category: category || null,
      views_count: service.viewsCount + 1, // Include the incremented count
    };
    
    logger.info('Service retrieved successfully', { serviceId });
    
    return successResponse(formattedService);
  } catch (error: any) {
    logger.error('Get service error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }
}