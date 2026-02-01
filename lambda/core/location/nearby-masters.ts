import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { MastersLocationService, SearchFilters } from '../shared/services/masters-location.service';
import { CacheService } from '../shared/services/cache.service';

const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  latitude: z.string().regex(/^-?\d+\.?\d*$/).transform(Number),
  longitude: z.string().regex(/^-?\d+\.?\d*$/).transform(Number),
  radius: z.string().regex(/^\d+$/).transform(Number).default('10'), // km
  categoryId: z.string().uuid().optional(),
  services: z.string().optional(), // comma-separated service names
  minRating: z.string().regex(/^\d+\.?\d*$/).transform(Number).optional(),
  verified: z.enum(['true', 'false']).optional(),
  available: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0')
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Validate coordinates
    if (Math.abs(validatedQuery.latitude) > 90) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid latitude');
    }
    if (Math.abs(validatedQuery.longitude) > 180) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid longitude');
    }
    if (validatedQuery.radius > 100) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Maximum radius is 100km');
    }

    // Create search filters
    const filters: SearchFilters = {
      latitude: validatedQuery.latitude,
      longitude: validatedQuery.longitude,
      radius: validatedQuery.radius,
      categoryId: validatedQuery.categoryId,
      services: validatedQuery.services?.split(',').map(s => s.trim()),
      minRating: validatedQuery.minRating,
      verified: validatedQuery.verified === 'true',
      available: validatedQuery.available === 'true',
      limit: validatedQuery.limit,
      offset: validatedQuery.offset
    };

    // Check cache first
    const cacheKey = createCacheKey(filters);
    const cachedResults = await cache.get(cacheKey);
    
    if (cachedResults) {
      return createResponse(200, cachedResults);
    }

    // Search for nearby masters
    const mastersLocationService = new MastersLocationService();
    const result = await mastersLocationService.findNearbyMasters(filters);

    // Cache the response for 10 minutes
    await cache.set(cacheKey, result, 600);

    return createResponse(200, result);

  } catch (error) {
    console.error('Error finding nearby masters:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to find nearby masters');
  }
};

function createCacheKey(filters: SearchFilters): string {
  // Create a stable cache key from filters
  const keyParts = [
    `lat:${filters.latitude.toFixed(6)}`,
    `lng:${filters.longitude.toFixed(6)}`,
    `radius:${filters.radius}`,
    `category:${filters.categoryId || 'all'}`,
    `services:${filters.services?.sort().join(',') || 'all'}`,
    `rating:${filters.minRating || 'any'}`,
    `verified:${filters.verified || 'any'}`,
    `available:${filters.available || 'any'}`,
    `limit:${filters.limit}`,
    `offset:${filters.offset}`
  ];
  
  return `nearby-masters:${keyParts.join(':')}`;
}

function createResponse(statusCode: number, data: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(data)
  };
}

function createErrorResponse(statusCode: number, errorCode: string, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      error: {
        code: errorCode,
        message
      }
    })
  };
}