import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@/shared/db/mock-prisma';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { validateInput } from '@/shared/utils/validation';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';
import { NotificationService } from '@/shared/services/notification';

const prisma = new PrismaClient();
const cache = new CacheService();
const notificationService = new NotificationService();

// Validation schema
const cancelProjectSchema = z.object({
  reason: z.string().min(10).max(500).optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    const projectId = event.pathParameters?.id;
    
    if (!projectId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Project ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(cancelProjectSchema)(body);

    // Mock project cancellation
    // In real implementation, this would:
    // 1. Find project by ID
    // 2. Check if user has permission (master or client)
    // 3. Check if project can be cancelled (status = pending or in_progress)
    // 4. Update project status to cancelled
    // 5. Set cancellation date and reason
    // 6. Handle refunds/payments
    // 7. Send notifications
    // 8. Update statistics

    const cancelledProject = {
      id: parseInt(projectId),
      order: {
        id: 1,
        title: 'Kitchen Renovation',
        description: 'Complete kitchen renovation with modern appliances',
        category_name: 'Construction',
        budget_display: '50000-80000 KGS',
        address: '123 Main St, Bishkek',
        city: 'Bishkek'
      },
      client: {
        id: 2,
        name: 'John Doe',
        avatar: 'https://mock-cdn.example.com/avatars/client2.jpg',
        rating: '4.2',
        phone: '+996555654321'
      },
      master: {
        id: 1,
        name: 'Expert Master',
        avatar: 'https://mock-cdn.example.com/avatars/master1.jpg',
        rating: '4.8',
        phone: '+996555123456'
      },
      agreed_price: '65000',
      start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_duration: '14 days',
      status: 'cancelled',
      status_display: 'Cancelled',
      progress: 25, // Progress at time of cancellation
      description: 'Kitchen renovation project with modern design',
      notes: 'Project cancelled due to unforeseen circumstances',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      cancelled_at: new Date().toISOString(),
      cancellation_reason: validatedData.reason || 'Project cancelled by user'
    };

    // Send cancellation notification to the other party
    const otherPartyUserId = user.role === 'MASTER' ? 'client-user-id' : 'master-user-id';
    const cancelledBy = user.role === 'MASTER' ? 'master' : 'client';

    await notificationService.sendNotification({
      userId: otherPartyUserId,
      type: 'PROJECT_CANCELLED',
      title: 'Project Cancelled',
      message: `The project has been cancelled by the ${cancelledBy}.`,
      data: {
        projectId: projectId,
        cancelledBy: cancelledBy,
        reason: validatedData.reason,
        cancelledAt: new Date().toISOString()
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`project:${projectId}*`);
    await cache.invalidatePattern(`projects:my:*`);

    console.log(`Project ${projectId} cancelled by user ${user.userId}`);

    return createResponse(200, cancelledProject);

  } catch (error) {
    console.error('Error cancelling project:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to cancel project');
  } finally {
    await prisma.$disconnect();
  }
};