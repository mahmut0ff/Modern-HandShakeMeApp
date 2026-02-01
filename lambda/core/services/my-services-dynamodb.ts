import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { verifyToken } from '../shared/services/token';
import { successResponse, unauthorizedResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return unauthorizedResponse('Missing authorization token');
    }

    const decoded = verifyToken(token);
    const serviceRepo = new ServiceRepository();
    
    // Get query parameters for filtering
    const includeInactive = event.queryStringParameters?.includeInactive === 'true';
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 50;
    
    const services = await serviceRepo.findByMaster(decoded.userId, {
      isActive: includeInactive ? undefined : true,
      limit
    });

    logger.info('My services retrieved successfully', { 
      masterId: decoded.userId, 
      count: services.length,
      includeInactive 
    });

    return successResponse({
      services,
      stats: {
        total: services.length,
        active: services.filter(s => s.isActive).length,
        inactive: services.filter(s => !s.isActive).length,
      }
    });
  } catch (error: any) {
    logger.error('Get my services error:', error);
    
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
