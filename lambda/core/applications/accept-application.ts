// Accept application and start order

import type { APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { notificationService } from '../shared/services/notification.service';
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
  const chatRepo = new ChatRepository();
  const userRepo = new UserRepository();
  
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
  
  // Update order status and assign master
  await orderRepo.update(orderId, {
    status: 'IN_PROGRESS',
    masterId: application.masterId,
    acceptedApplicationId: applicationId,
  });
  
  // Create chat room between client and master
  const chatRoom = await chatRepo.createRoom({
    participants: [userId, application.masterId],
    orderId: orderId,
  });
  
  // Send notifications
  try {
    // Notify accepted master
    await notificationService.notifyApplicationAccepted(
      applicationId,
      orderId,
      application.masterId,
      order.title
    );
    
    // Notify rejected masters
    for (const rejectedApp of otherPendingApplications) {
      await notificationService.notifyApplicationRejected(
        rejectedApp.id,
        orderId,
        rejectedApp.masterId,
        order.title
      );
    }
  } catch (error) {
    logger.error('Failed to send application acceptance notifications', error);
    // Don't fail the request if notifications fail
  }
  
  logger.info('Application accepted and chat created', {
    userId,
    applicationId,
    chatRoomId: chatRoom.id,
  });
  
  return success({
    application: acceptedApp,
    chatRoom: chatRoom,
  });
}

export const handler = withErrorHandler(withAuth(acceptApplicationHandler, { roles: ['CLIENT'] }));
