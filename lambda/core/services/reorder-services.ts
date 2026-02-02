// Reorder services Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { successResponse, badRequestResponse, forbiddenResponse, unauthorizedResponse } from '../shared/utils/unified-response';
import { verifyToken } from '../shared/services/token';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';

const reorderSchema = z.object({
  service_ids: z.array(z.string().uuid()),
});

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return unauthorizedResponse('Missing authorization token');
    }
    
    const decoded = verifyToken(token);
    
    if (decoded.role !== 'MASTER') {
      return forbiddenResponse('Only masters can reorder services');
    }
    
    logger.info('Reorder services request', { userId: decoded.userId });
    
    const body = JSON.parse(event.body || '{}');
    
    const validationResult = reorderSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequestResponse('Validation failed', validationResult.error.errors);
    }
    
    const data = validationResult.data;
    
    const serviceRepository = new ServiceRepository();
    
    // Verify all services belong to the master and reorder them
    const reorderedServices = await serviceRepository.reorderServices(decoded.userId, data.service_ids);
    
    logger.info('Services reordered successfully', { 
      userId: decoded.userId, 
      serviceCount: reorderedServices.length 
    });
    
    return successResponse({
      services: reorderedServices,
      message: 'Services reordered successfully'
    });
  } catch (error: any) {
    logger.error('Reorder services error:', error);
    
    if (error.message === 'Invalid token') {
      return unauthorizedResponse('Invalid or expired token');
    }
    
    if (error.message.includes('not found or doesn\'t belong to master')) {
      return forbiddenResponse(error.message);
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
