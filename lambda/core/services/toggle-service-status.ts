// Toggle service status Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyToken } from '../shared/services/token';
import { successResponse, badRequestResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';
import { ServiceRepository } from '../shared/repositories/service.repository';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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
    
    logger.info('Toggle service status request', { userId: decoded.userId, serviceId });
    
    // Check if user is a master (from token)
    if (decoded.role !== 'MASTER') {
      return forbiddenResponse('Only masters can toggle service status');
    }
    
    const serviceRepository = new ServiceRepository();
    
    // Check if service exists and belongs to the master
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      return notFoundResponse('Service not found');
    }
    
    if (service.masterId !== decoded.userId) {
      return forbiddenResponse('You can only modify your own services');
    }
    
    // Toggle the status
    const updatedService = await serviceRepository.toggleStatus(serviceId);
    
    logger.info('Service status toggled successfully', { 
      serviceId, 
      userId: decoded.userId,
      oldStatus: service.isActive,
      newStatus: updatedService.isActive
    });
    
    return successResponse(updatedService);
  } catch (error: any) {
    logger.error('Toggle service status error:', error);
    
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