import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@/shared/db/mock-prisma';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';
import { NotificationService } from '@/shared/services/notification';

const prisma = new PrismaClient();
const cache = new CacheService();
const notificationService = new NotificationService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    const applicationId = event.pathParameters?.id;
    
    if (!applicationId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Application ID is required');
    }

    if (user.role !== 'MASTER') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only masters can delete applications');
    }

    // Mock application deletion
    // In real implementation, this would:
    // 1. Find application by ID
    // 2. Check if user owns the application
    // 3. Check if application can be deleted (status = pending)
    // 4. Delete application record
    // 5. Send notification to client
    // 6. Update order applications count

    // Send notification to client
    await notificationService.sendNotification({
      userId: 'client-user-id',
      type: 'APPLICATION_WITHDRAWN',
      title: 'Application Withdrawn',
      message: 'A master has withdrawn their application for your order',
      data: {
        applicationId: applicationId,
        orderId: 'order-id'
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`application:${applicationId}*`);
    await cache.invalidatePattern(`applications:my:${user.userId}*`);
    await cache.invalidatePattern(`order:*:applications*`);

    console.log(`Application ${applicationId} deleted by user ${user.userId}`);

    return createResponse(200, {
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting application:', error);
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to delete application');
  } finally {
    await prisma.$disconnect();
  }
};