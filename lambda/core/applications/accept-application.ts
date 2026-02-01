// Accept application and create project

import type { APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { NotificationService } from '../shared/services/notification';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function acceptApplicationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const applicationId = event.pathParameters?.id;
  
  if (!applicationId) {
    return badRequest('Application ID is required');
  }
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can accept applications');
  }
  
  logger.info('Accept application request', { userId, applicationId });
  
  const applicationRepo = new ApplicationRepository();
  const orderRepo = new OrderRepository();
  const projectRepo = new ProjectRepository();
  const userRepo = new UserRepository();
  const notificationService = new NotificationService();
  
  // First, we need to find the application by checking all orders
  // Since we only have applicationId, we need to find which order it belongs to
  // This is a limitation of the current key structure - in production, consider adding GSI
  
  // For now, let's assume the orderId is passed as a query parameter
  const orderId = event.queryStringParameters?.orderId;
  if (!orderId) {
    return badRequest('Order ID is required as query parameter');
  }
  
  // Get application
  const application = await applicationRepo.findById(orderId, applicationId);
  if (!application) {
    return notFound('Application not found');
  }
  
  // Get order to verify ownership
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return notFound('Order not found');
  }
  
  // Verify user owns the order
  if (order.clientId !== userId) {
    return forbidden('You can only accept applications for your own orders');
  }
  
  if (application.status !== 'PENDING') {
    return badRequest('Application is not pending');
  }
  
  // Get all other pending applications for rejection notifications
  const allApplications = await applicationRepo.findByOrder(orderId);
  const otherPendingApplications = allApplications.filter(
    app => app.id !== applicationId && app.status === 'PENDING'
  );
  
  // Accept the application
  const acceptedApp = await applicationRepo.updateStatus(orderId, applicationId, 'ACCEPTED');
  
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
    logger.error('Failed to send application acceptance notifications', error);
    // Don't fail the request if notifications fail
  }
  
  logger.info('Application accepted and project created', {
    userId,
    applicationId,
    projectId: project.id,
  });
  
  return success({
    application: acceptedApp,
    project: project
  });
}

export const handler = withErrorHandler(withAuth(acceptApplicationHandler, { roles: ['CLIENT'] }));
