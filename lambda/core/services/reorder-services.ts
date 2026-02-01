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
    if (services.length !== data.service_ids.length) {
      return badRequest('Some services not found or do not belong to you');
    }
    
    // Update order numbers
    const updatePromises = data.service_ids.map((serviceId, index) =>
      prisma.masterService.update({
        where: { id: serviceId },
        data: { order_num: index + 1 },
      })
    );
    
    await Promise.all(updatePromises);
    
    // Get updated services
    const updatedServices = await prisma.masterService.findMany({
      where: {
        masterId: userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        order_num: 'asc',
      },
    });
    
    logger.info('Services reordered successfully', { userId });
    
    // Format response
    const response = updatedServices.map(service => ({
      id: service.id,
      master: service.masterId,
      name: service.name,
      description: service.description,
      category: service.categoryId,
      category_name: service.category.name,
      price_from: service.priceFrom.toString(),
      price_to: service.priceTo?.toString(),
      unit: service.unit.toLowerCase(),
      is_active: service.isActive,
      is_featured: service.isFeatured || false,
      order_num: service.order_num || 0,
      created_at: service.createdAt.toISOString(),
      updated_at: service.updatedAt.toISOString(),
    }));
    
    return success(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error.errors[0].message);
    }
    throw error;
  }
}

export const handler = withErrorHandler(withAuth(reorderServicesHandler));
