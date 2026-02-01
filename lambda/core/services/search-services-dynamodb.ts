import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { paginatedResponse, badRequestResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';

const searchSchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  search: z.string().min(2).optional(),
  location: z.enum(['CLIENT_LOCATION', 'MASTER_LOCATION', 'REMOTE', 'BOTH']).optional(),
  page: z.coerce.number().min(1).default(1),
  page_size: z.coerce.number().min(1).max(100).default(20),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = event.queryStringParameters || {};
    const validationResult = searchSchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return badRequestResponse('Invalid query parameters', validationResult.error.errors);
    }
    
    const { 
      category, 
      city, 
      min_price, 
      max_price, 
      search,
      location,
      page,
      page_size
    } = validationResult.data;

    logger.info('Search services request', { 
      category, 
      city, 
      min_price, 
      max_price, 
      search, 
      location,
      page,
      page_size 
    });

    const serviceRepository = new ServiceRepository();
    
    // Build search options
    const searchOptions = {
      query: search,
      categoryId: category,
      location: location,
      priceMin: min_price,
      priceMax: max_price,
      isActive: true,
      limit: page_size * page, // Get more for pagination
    };
    
    // Search services
    const allServices = await serviceRepository.searchServices(searchOptions);
    
    // Apply city filter if provided (this would need to be added to Service model)
    let filteredServices = allServices;
    if (city) {
      // For now, we'll skip city filtering since it's not in the Service model
      // In a real implementation, you'd add city/address fields to the Service model
      logger.warn('City filtering not implemented - requires Service model update');
    }
    
    // Manual pagination
    const startIndex = (page - 1) * page_size;
    const endIndex = startIndex + page_size;
    const paginatedServices = filteredServices.slice(startIndex, endIndex);
    const total = filteredServices.length;

    // Format services for response
    const formattedServices = paginatedServices.map(service => ({
      id: service.id,
      master_id: service.masterId,
      title: service.title,
      description: service.description,
      category_id: service.categoryId,
      price_from: service.priceFrom,
      price_to: service.priceTo,
      price_type: service.priceType.toLowerCase(),
      location: service.location.toLowerCase(),
      is_active: service.isActive,
      rating: service.rating,
      reviews_count: service.reviewsCount,
      images: service.images,
      created_at: service.createdAt
    }));

    logger.info('Search completed', { 
      total: total,
      returned: formattedServices.length,
      page,
      page_size 
    });

    return paginatedResponse(formattedServices, total, page, page_size);
  } catch (error: any) {
    logger.error('Search services error:', error);
    
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
};
