import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { verifyToken } from '../shared/services/token';
import { successResponse, badRequestResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

const updateServiceSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  priceType: z.enum(['FIXED', 'HOURLY', 'NEGOTIABLE']).optional(),
  priceFrom: z.number().positive().optional(),
  priceTo: z.number().positive().optional(),
  pricePerHour: z.number().positive().optional(),
  duration: z.string().optional(),
  location: z.enum(['CLIENT_LOCATION', 'MASTER_LOCATION', 'REMOTE', 'BOTH']).optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.string().optional(),
}).refine((data) => {
  if (data.priceTo && data.priceFrom && data.priceTo < data.priceFrom) {
    return false;
  }
  return true;
}, {
  message: "priceTo must be greater than or equal to priceFrom",
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return unauthorizedResponse('Missing authorization token');
    }

    const decoded = verifyToken(token);
    const serviceId = event.pathParameters?.id;

    if (!serviceId) {
      return badRequestResponse('Service ID is required');
    }

    const serviceRepo = new ServiceRepository();
    
    // Check if service exists and belongs to the master
    const existingService = await serviceRepo.findById(serviceId);
    if (!existingService) {
      return notFoundResponse('Service not found');
    }
    
    if (existingService.masterId !== decoded.userId) {
      return forbiddenResponse('You can only update your own services');
    }

    const body = JSON.parse(event.body || '{}');
    
    const validationResult = updateServiceSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequestResponse('Validation failed', validationResult.error.errors);
    }
    
    const data = validationResult.data;

    const updatedService = await serviceRepo.update(serviceId, data);

    logger.info('Service updated successfully', { serviceId, masterId: decoded.userId });

    return successResponse(updatedService);
  } catch (error: any) {
    logger.error('Update service error:', error);
    
    if (error.message === 'Invalid token') {
      return unauthorizedResponse('Invalid or expired token');
    }
    
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
