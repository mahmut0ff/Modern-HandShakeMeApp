import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@/shared/db/mock-prisma';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    const applicationId = event.pathParameters?.id;
    
    if (!applicationId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Application ID is required');
    }

    if (user.role !== 'CLIENT') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only clients can mark applications as viewed');
    }

    // Mock marking application as viewed
    // In real implementation, this would:
    // 1. Find application by ID
    // 2. Check if user owns the order
    // 3. Update viewed_at timestamp
    // 4. Send notification to master (optional)

    console.log(`Application ${applicationId} marked as viewed by user ${user.userId}`);

    // Invalidate cache
    await cache.invalidatePattern(`application:${applicationId}*`);
    await cache.invalidatePattern(`order:*:applications*`);

    return createResponse(200, {
      message: 'Application marked as viewed',
      viewed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error marking application as viewed:', error);
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to mark application as viewed');
  } finally {
    await prisma.$disconnect();
  }
};