import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@/shared/db/mock-prisma';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { validateInput } from '@/shared/utils/validation';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

// Validation schema
const updateApplicationSchema = z.object({
  proposed_price: z.number().positive().optional(),
  message: z.string().min(10).max(2000).optional(),
  estimated_duration: z.string().optional(),
  start_date: z.string().datetime().optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    const applicationId = event.pathParameters?.id;
    
    if (!applicationId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Application ID is required');
    }

    if (user.role !== 'MASTER') {
      return createErrorResponse(403, 'FORBIDDEN', 'Only masters can update applications');
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(updateApplicationSchema)(body);

    // Mock application update
    // In real implementation, this would:
    // 1. Find application by ID
    // 2. Check if user owns the application
    // 3. Check if application can be updated (status = pending)
    // 4. Update application data
    // 5. Send notification to client

    const updatedApplication = {
      id: parseInt(applicationId),
      order: 1,
      order_title: 'Kitchen Renovation Project',
      order_budget_display: '50000-80000 KGS',
      master: {
        id: 1,
        name: 'Expert Master',
        avatar: 'https://mock-cdn.example.com/avatars/master1.jpg',
        rating: '4.8',
        phone: '+996555123456'
      },
      client: {
        id: 2,
        name: 'John Doe',
        avatar: 'https://mock-cdn.example.com/avatars/client2.jpg',
        rating: '4.2',
        phone: '+996555654321'
      },
      proposed_price: validatedData.proposed_price?.toString() || '65000',
      message: validatedData.message || 'Updated application message',
      estimated_duration: validatedData.estimated_duration || '14 days',
      start_date: validatedData.start_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      status_display: 'Pending Review',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    // Invalidate cache
    await cache.invalidatePattern(`application:${applicationId}*`);
    await cache.invalidatePattern(`applications:my:${user.userId}*`);

    console.log(`Application ${applicationId} updated by user ${user.userId}`);

    return createResponse(200, updatedApplication);

  } catch (error) {
    console.error('Error updating application:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to update application');
  } finally {
    await prisma.$disconnect();
  }
};