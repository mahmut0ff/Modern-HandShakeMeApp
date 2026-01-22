import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { success, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Authenticate user
    const user = await requireAuth()(event);
    
    // Validate user is a master
    if (user.role !== 'master') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only masters can delete services');
    }

    // Get service ID from path parameters
    const serviceId = event.pathParameters?.id;
    if (!serviceId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Service ID is required');
    }

    // Check if service exists and belongs to the master
    const existingService = await prisma.masterService.findFirst({
      where: {
        id: serviceId,
        masterId: user.userId
      }
    });

    if (!existingService) {
      return createErrorResponse(404, 'NOT_FOUND', 'Service not found or access denied');
    }

    // Check if service is being used in active orders
    const activeOrdersCount = await prisma.order.count({
      where: {
        masterId: user.userId,
        status: {
          in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS']
        },
        // Assuming there's a serviceId field in orders or related table
        // This would need to be adjusted based on actual schema
        OR: [
          {
            description: {
              contains: existingService.name,
              mode: 'insensitive'
            }
          }
        ]
      }
    });

    if (activeOrdersCount > 0) {
      return createErrorResponse(409, 'CONFLICT', 
        'Cannot delete service that is referenced in active orders. Please complete or cancel related orders first.');
    }

    // Soft delete approach - deactivate instead of hard delete
    const queryParam = event.queryStringParameters?.force;
    const forceDelete = queryParam === 'true';

    if (forceDelete) {
      // Hard delete - completely remove from database
      await prisma.masterService.delete({
        where: { id: serviceId }
      });
      
      console.log(`Service hard deleted: ${serviceId} by master ${user.userId}`);
    } else {
      // Soft delete - just deactivate
      await prisma.masterService.update({
        where: { id: serviceId },
        data: { isActive: false }
      });
      
      console.log(`Service deactivated: ${serviceId} by master ${user.userId}`);
    }

    // Invalidate cache
    await cache.invalidatePattern(`master:services:${user.userId}*`);
    await cache.invalidatePattern(`master:profile:${user.userId}*`);

    return createResponse(200, {
      message: forceDelete ? 'Service deleted successfully' : 'Service deactivated successfully',
      serviceId: serviceId,
      action: forceDelete ? 'deleted' : 'deactivated'
    });

  } catch (error) {
    console.error('Error deleting service:', error);
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    // Handle Prisma foreign key constraint errors
    if (error.code === 'P2003') {
      return createErrorResponse(409, 'CONFLICT', 
        'Cannot delete service due to existing references. Use soft delete instead.');
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to delete service');
  } finally {
    await prisma.$disconnect();
  }
};