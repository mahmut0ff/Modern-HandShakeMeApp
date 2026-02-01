import { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { NotificationService } from '../shared/services/notification';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

const respondSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT'], {
    errorMap: () => ({ message: 'Action must be either ACCEPT or REJECT' })
  }),
});

async function respondToApplicationHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const { orderId, applicationId } = event.pathParameters || {};
  
  if (!orderId || !applicationId) {
    return badRequest('Order ID and Application ID are required');
  }
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can respond to applications');
  }
  
  logger.info('Respond to application request', { userId, orderId, applicationId });
  
  const body = JSON.parse(event.body || '{}');
  
  // Validate input
  let validatedData;
  try {
    validatedData = respondSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
  
  const orderRepo = new OrderRepository();
  const applicationRepo = new ApplicationRepository();
  const projectRepo = new ProjectRepository();
  const userRepo = new UserRepository();
  const notificationService = new NotificationService();
  
  // Get order to verify ownership
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return notFound('Order not found');
  }
  
  if (order.clientId !== userId) {
    return forbidden('You can only respond to applications for your own orders');
  }
  
  // Get application
  const application = await applicationRepo.findById(orderId, applicationId);
  if (!application) {
    return notFound('Application not found');
  }
  
  if (application.status !== 'PENDING') {
    return badRequest('Application is not pending');
  }
  
  const { action } = validatedData;
  
  if (action === 'ACCEPT') {
    // Accept the application
    const acceptedApp = await applicationRepo.updateStatus(orderId, applicationId, 'ACCEPTED');
    
    // Get all other pending applications for rejection notifications
    const allApplications = await applicationRepo.findByOrder(orderId);
    const otherPendingApplications = allApplications.filter(
      app => app.id !== applicationId && app.status === 'PENDING'
    );
    
    // Reject all other applications for this order
    await applicationRepo.rejectAllOtherApplications(orderId, applicationId);
    
    // Update order status
    await orderRepo.updateStatus(orderId, 'IN_PROGRESS');
    
    // Create project
    const project = await projectRepo.create({
      orderId: orderId,
      masterId: application.masterId,
      clientId: order.clientId,
      applicationId: applicationId,
      budget: application.proposedPrice,
      deadline: order.deadline,
      status: 'IN_PROGRESS',
    });
    
    // Send notifications
    try {
      const [master, client] = await Promise.all([
        userRepo.findById(application.masterId),
        userRepo.findById(userId),
      ]);
      
      // Notify accepted master
      await notificationService.notifyApplicationAccepted(application.masterId, {
        applicationId,
        orderId,
        orderTitle: order.title,
        clientName: client?.name || `${client?.firstName} ${client?.lastName}`.trim(),
        projectId: project.id,
      });
      
      // Notify project creation to both parties
      await notificationService.notifyProjectCreated(
        application.masterId,
        userId,
        {
          applicationId,
          orderId,
          orderTitle: order.title,
          masterName: master?.name || `${master?.firstName} ${master?.lastName}`.trim(),
          projectId: project.id,
        }
      );
      
      // Notify rejected masters
      if (otherPendingApplications.length > 0) {
        const rejectedMasterIds = otherPendingApplications.map(app => app.masterId);
        await notificationService.notifyMultipleApplicationsRejected(rejectedMasterIds, {
          applicationId: '', // Not relevant for rejected applications
          orderId,
          orderTitle: order.title,
        });
      }
    } catch (error) {
      logger.error('Failed to send application response notifications', error);
      // Don't fail the request if notifications fail
    }
    
    logger.info('Application accepted and project created', {
      userId,
      applicationId,
      orderId,
      projectId: project.id,
    });
    
    return success({
      application: acceptedApp,
      project: project
    });
  } else {
    // Reject the application
    const rejectedApp = await applicationRepo.updateStatus(orderId, applicationId, 'REJECTED');
    
    // Send notification to master
    try {
      await notificationService.notifyApplicationRejected(application.masterId, {
        applicationId,
        orderId,
        orderTitle: order.title,
      });
    } catch (error) {
      logger.error('Failed to send application rejection notification', error);
      // Don't fail the request if notification fails
    }
    
    logger.info('Application rejected', {
      userId,
      applicationId,
      orderId,
    });
    
    return success({
      application: rejectedApp
    });
  }
}

export const handler = withErrorHandler(withAuth(respondToApplicationHandler, { roles: ['CLIENT'] }));
