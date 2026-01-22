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
const updateProjectSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional(),
  end_date: z.string().datetime().optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    const projectId = event.pathParameters?.id;
    
    if (!projectId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Project ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(updateProjectSchema)(body);

    // Mock project update
    // In real implementation, this would:
    // 1. Find project by ID
    // 2. Check if user has permission to update (master or client)
    // 3. Validate status transitions
    // 4. Update project data
    // 5. Send notifications to relevant parties
    // 6. Update related records (payments, milestones, etc.)

    const updatedProject = {
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
      start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: validatedData.end_date || new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_duration: '14 days',
      status: validatedData.status || 'in_progress',
      status_display: validatedData.status === 'completed' ? 'Completed' : 
                     validatedData.status === 'cancelled' ? 'Cancelled' : 'In Progress',
      progress: validatedData.progress !== undefined ? validatedData.progress : 35,
      description: validatedData.description || 'Kitchen renovation project with modern design',
      notes: validatedData.notes || 'Client prefers white cabinets and granite countertops',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      ...(validatedData.status === 'completed' && { completed_at: new Date().toISOString() }),
      ...(validatedData.status === 'cancelled' && { cancelled_at: new Date().toISOString() })
    };

    // Send notifications based on updates
    if (validatedData.status) {
      const statusMessages = {
        'completed': 'Project has been completed',
        'cancelled': 'Project has been cancelled',
        'in_progress': 'Project is now in progress'
      };

      await notificationService.sendNotification({
        userId: user.role === 'MASTER' ? 'client-user-id' : 'master-user-id',
        type: 'PROJECT_STATUS_CHANGED',
        title: 'Project Status Updated',
        message: statusMessages[validatedData.status],
        data: {
          projectId: projectId,
          newStatus: validatedData.status,
          progress: validatedData.progress
        }
      });
    }

    if (validatedData.progress !== undefined) {
      await notificationService.sendNotification({
        userId: user.role === 'MASTER' ? 'client-user-id' : 'master-user-id',
        type: 'PROJECT_PROGRESS_UPDATED',
        title: 'Project Progress Updated',
        message: `Project progress updated to ${validatedData.progress}%`,
        data: {
          projectId: projectId,
          progress: validatedData.progress
        }
      });
    }

    // Invalidate cache
    await cache.invalidatePattern(`project:${projectId}*`);
    await cache.invalidatePattern(`projects:my:*`);

    console.log(`Project ${projectId} updated by user ${user.userId}`);

    return createResponse(200, updatedProject);

  } catch (error) {
    console.error('Error updating project:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to update project');
  } finally {
    await prisma.$disconnect();
  }
};