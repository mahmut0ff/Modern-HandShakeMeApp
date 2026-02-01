// List services Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { paginatedResponse, badRequestResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';
import { ServiceRepository, ServiceCategoryRepository } from '../shared/repositories/service.repository';
import { z } from 'zod';

const listServicesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  page_size: z.coerce.number().min(1).max(100).default(20),
  master_id: z.string().optional(),
  category_id: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  location: z.enum(['CLIENT_LOCATION', 'MASTER_LOCATION', 'REMOTE', 'BOTH']).optional(),
  price_min: z.coerce.number().positive().optional(),
  price_max: z.coerce.number().positive().optional(),
  search: z.string().min(2).optional(),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    logger.info('List services request');
    
    const queryParams = event.queryStringParameters || {};
    const result = listServicesSchema.safeParse(queryParams);
    
    if (!result.success) {
      return badRequestResponse('Invalid query parameters', result.error.errors);
    }
    
    const { 
      page, 
      page_size, 
      master_id, 
      category_id, 
      is_active, 
      location,
      price_min,
      price_max,
      search 
    } = result.data;
    
    const serviceRepository = new ServiceRepository();
    
    // Build search options
    const searchOptions = {
      query: search,
      categoryId: category_id,
      masterId: master_id,
      location: location,
      priceMin: price_min,
      priceMax: price_max,
      isActive: is_active !== undefined ? is_active === 'true' : true,
      limit: page_size * page, // Get more for pagination
    };
    
    // Search services
    const allServices = await serviceRepository.searchServices(searchOptions);
    
    // Manual pagination
    const startIndex = (page - 1) * page_size;
    const endIndex = startIndex + page_size;
    const paginatedServices = allServices.slice(startIndex, endIndex);
    const total = allServices.length;
    
    logger.info('Services retrieved', { 
      count: paginatedServices.length,
      total,
      filters: searchOptions 
    });
    
    // Get category names for services
    const categoryRepository = new ServiceCategoryRepository();
    const categoryIds = [...new Set(paginatedServices.map(s => s.categoryId))];
    const categories = await Promise.all(
      categoryIds.map(id => categoryRepository.findById(id))
    );
    const categoryMap = Object.fromEntries(
      categories.filter(Boolean).map(cat => [cat!.id, cat!.name])
    );
    
    // Format services for mobile app
    const formattedServices = paginatedServices.map(service => ({
      id: service.id,
      master_id: service.masterId,
      category_id: service.categoryId,
      category_name: categoryMap[service.categoryId] || '',
      title: service.title,
      description: service.description,
      price_type: service.priceType.toLowerCase(),
      price_from: service.priceFrom?.toString(),
      price_to: service.priceTo?.toString(),
      price_per_hour: service.pricePerHour?.toString(),
      duration: service.duration,
      location: service.location.toLowerCase(),
      is_active: service.isActive,
      is_instant_booking: service.isInstantBooking,
      tags: service.tags,
      images: service.images,
      views_count: service.viewsCount,
      orders_count: service.ordersCount,
      rating: service.rating,
      reviews_count: service.reviewsCount,
      created_at: service.createdAt,
      updated_at: service.updatedAt,
    }));
    
    return paginatedResponse(formattedServices, total, page, page_size);
  } catch (error: any) {
    logger.error('List services failed', { error });
    
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