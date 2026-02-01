// Get specific master's services Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceRepository, ServiceCategoryRepository } from '../shared/repositories/service.repository';
import { successResponse, notFoundResponse, badRequestResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const masterId = event.pathParameters?.id;
    
    if (!masterId) {
      return badRequestResponse('Master ID is required');
    }
    
    logger.info('Get master services request', { masterId });
    
    const serviceRepository = new ServiceRepository();
    
    // Get master's services
    const services = await serviceRepository.findByMaster(masterId, {
      isActive: true,
    });
    
    if (services.length === 0) {
      logger.info('No services found for master', { masterId });
      return successResponse({
        services: [],
        stats: {
          total: 0,
          active: 0,
        }
      });
    }
    
    // Get category information
    const categoryRepository = new ServiceCategoryRepository();
    const categoryIds = [...new Set(services.map(s => s.categoryId))];
    const categories = await Promise.all(
      categoryIds.map(id => categoryRepository.findById(id))
    );
    const categoryMap = Object.fromEntries(
      categories.filter(Boolean).map(cat => [cat!.id, cat!])
    );
    
    // Format services with category info
    const formattedServices = services.map(service => ({
      ...service,
      category: categoryMap[service.categoryId] || null,
    }));
    
    logger.info('Master services retrieved successfully', { 
      masterId, 
      serviceCount: services.length 
    });
    
    return successResponse({
      services: formattedServices,
      stats: {
        total: services.length,
        active: services.filter(s => s.isActive).length,
      }
    });
  } catch (error: any) {
    logger.error('Get master services error:', error);
    
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
