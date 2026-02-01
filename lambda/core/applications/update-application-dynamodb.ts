import { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { NotificationService } from '../shared/services/notification';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const updateApplicationSchema = z.object({
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters').max(2000, 'Cover letter must be less than 2000 characters').optional(),
  proposedPrice: z.number().positive('Proposed price must be positive').optional(),
  proposedDurationDays: z.number().positive('Duration must be positive').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

async function updateApplicationHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const applicationId = event.pathParameters?.id;
  const orderId = event.queryStringParameters?.orderId;
  
  if (!applicationId) {
    return badRequest('Application ID is required');
  }
  
  if (!orderId) {
    return badRequest('Order ID is required as query parameter');
  }
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can update their applications');
  }
  
  logger.info('Update application request', { userId, applicationId, orderId });
  
  const body = JSON.parse(event.body || '{}');
  
  // Validate input
  let validatedData;
  try {
    validatedData = updateApplicationSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  const applicationRepo = new ApplicationRepository();
  const orderRepo = new OrderRepository();
  const userRepo = new UserRepository();
  const notificationService = new NotificationService();
  
  // Get application to verify ownership
  const application = await applicationRepo.findById(orderId, applicationId);
  if (!application) {
    return notFound('Application not found');
  }
  
  // Verify user owns the application
  if (application.masterId !== userId) {
    return forbidden('You can only update your own applications');
  }
  
  // Only allow updates to pending applications
  if (application.status !== 'PENDING') {
    return badRequest('Can only update pending applications');
  }
  
  // Update application
  const updatedApplication = await applicationRepo.update(orderId, applicationId, validatedData);
  
  // Send notification to client if application was significantly updated
  const significantUpdate = validatedData.proposedPrice !== undefined || 
                           validatedData.proposedDurationDays !== undefined;
  
  if (significantUpdate) {
    try {
      const [order, master] = await Promise.all([
        orderRepo.findById(orderId),
        userRepo.findById(userId),
      ]);
      
      if (order) {
        await notificationService.notifyApplicationUpdated(order.clientId, {
          applicationId,
          orderId,
          orderTitle: order.title,
          masterName: master?.name || `${master?.firstName} ${master?.lastName}`.trim(),
        });
      }
    } catch (error) {
      logger.error('Failed to send application updated notification', error);
      // Don't fail the request if notification fails
    }
  }
  
  logger.info('Application updated successfully', {
    userId,
    applicationId,
    orderId,
    updatedFields: Object.keys(validatedData),
    significantUpdate,
  });
  
  return success(updatedApplication);
}

export const handler = withErrorHandler(withAuth(updateApplicationHandler, { roles: ['MASTER'] }));
