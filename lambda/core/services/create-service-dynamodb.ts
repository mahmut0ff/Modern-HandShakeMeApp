import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { verifyToken } from '../shared/services/token';
import { successResponse, badRequestResponse, unauthorizedResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

const createServiceSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500).optional(),
  priceType: z.enum(['FIXED', 'HOURLY', 'NEGOTIABLE']).default('FIXED'),
  priceFrom: z.number().positive(),
  priceTo: z.number().positive().optional(),
  pricePerHour: z.number().positive().optional(),
  duration: z.string().optional(),
  location: z.enum(['CLIENT_LOCATION', 'MASTER_LOCATION', 'REMOTE', 'BOTH']).default('BOTH'),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.string().optional(),
}).refine((data) => {
  if (data.priceTo && data.priceTo < data.priceFrom) {
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
    const body = JSON.parse(event.body || '{}');
    
    const validationResult = createServiceSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequestResponse('Validation failed', validationResult.error.errors);
    }
    
    const data = validationResult.data;

    const serviceRepo = new ServiceRepository();
    const service = await serviceRepo.create({
      ...data,
      masterId: decoded.userId,
    });

    logger.info('Service created successfully', { serviceId: service.id, masterId: decoded.userId });

    return successResponse(service, { statusCode: 201 });
  } catch (error: any) {
    logger.error('Create service error:', error);
    
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
