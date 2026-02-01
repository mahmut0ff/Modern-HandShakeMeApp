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

const createApplicationSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters').max(2000, 'Cover letter must be less than 2000 characters'),
  proposedPrice: z.number().positive('Proposed price must be positive'),
  proposedDurationDays: z.number().positive('Duration must be positive'),
});

async function createApplicationHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can create applications');
  }
  
  logger.info('Create application request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  
  // Validate input
  let validatedData;
  try {
    validatedData = createApplicationSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  const orderRepo = new OrderRepository();
  const applicationRepo = new ApplicationRepository();
  const userRepo = new UserRepository();
  const notificationService = new NotificationService();
  
  // Check if order exists and is active
  const order = await orderRepo.findById(validatedData.orderId);
  if (!order) {
    return notFound('Order not found');
  }
  
  if (order.status !== 'ACTIVE') {
    return badRequest('Order is not active');
  }
  
  // Check if master already applied to this order
  const existingApplications = await applicationRepo.findByOrder(validatedData.orderId);
  const existingApplication = existingApplications.find(app => app.masterId === userId);
  
  if (existingApplication) {
    return badRequest('You have already applied to this order');
  }
  
  // Get master details for notification
  const master = await userRepo.findById(userId);
  
  // Create application
  const application = await applicationRepo.create(userId, validatedData);
  
  // Update order applications count
  await orderRepo.incrementApplicationsCount(validatedData.orderId);
  
  // Send notification to client
  try {
    await notificationService.notifyApplicationCreated(order.clientId, {
      applicationId: application.id,
      orderId: validatedData.orderId,
      orderTitle: order.title,
      masterName: master?.name || `${master?.firstName} ${master?.lastName}`.trim(),
      proposedPrice: validatedData.proposedPrice,
    });
  } catch (error) {
    logger.error('Failed to send application created notification', error);
    // Don't fail the request if notification fails
  }
  
  logger.info('Application created successfully', {
    userId,
    applicationId: application.id,
    orderId: validatedData.orderId,
  });
  
  return success(application, { statusCode: 201 });
}

export const handler = withErrorHandler(withAuth(createApplicationHandler, { roles: ['MASTER'] }));