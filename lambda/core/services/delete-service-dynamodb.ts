import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { verifyToken } from '../shared/services/token';
import { successResponse, badRequestResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

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
    const service = await serviceRepo.findById(serviceId);
    if (!service) {
      return notFoundResponse('Service not found');
    }
    
    if (service.masterId !== decoded.userId) {
      return forbiddenResponse('You can only delete your own services');
    }

    await serviceRepo.delete(serviceId);

    logger.info('Service deleted successfully', { serviceId, masterId: decoded.userId });

    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  } catch (error: any) {
    logger.error('Delete service error:', error);
    
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
