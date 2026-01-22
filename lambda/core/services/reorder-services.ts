// Reorder services Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

const reorderSchema = z.object({
  service_ids: z.array(z.number().int().positive()),
});

async function reorderServicesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can reorder services');
  }
  
  logger.info('Reorder services request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  
  try {
    const data = reorderSchema.parse(body);
    
    const prisma = getPrismaClient();
    
    // Verify all services belong to the master
    const services = await prisma.masterService.findMany({
      where: {
        id: { in: data.service_ids },
        masterId: userId,
      },
    });
    
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
