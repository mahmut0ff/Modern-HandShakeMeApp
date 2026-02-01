import { APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { NotificationService } from '../shared/services/notification';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function markApplicationViewedHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const applicationId = event.pathParameters?.id;
  const orderId = event.queryStringParameters?.orderId;
  
  if (!applicationId) {
    return badRequest('Application ID is required');
  }
  
  if (!orderId) {
    return badRequest('Order ID is required as query parameter');
  }
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can mark applications as viewed');
  }
  
  logger.info('Mark application viewed request', { userId, applicationId, orderId });
  
  const applicationRepo = new ApplicationRepository();
  const orderRepo = new OrderRepository();
  const userRepo = new UserRepository();
  const notificationService = new NotificationService();
  
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
    return forbidden('You can only mark applications as viewed for your own orders');
  }
  
  // Skip if already viewed
  if (application.viewedAt) {
    return success({
      message: 'Application already marked as viewed',
      viewedAt: application.viewedAt
    });
  }
  
  // Mark application as viewed
  const updatedApplication = await applicationRepo.markViewed(orderId, applicationId);
  
  // Send notification to master
  try {
    const client = await userRepo.findById(userId);
    await notificationService.notifyApplicationViewed(application.masterId, {
      applicationId,
      orderId,
      orderTitle: order.title,
      clientName: client?.name || `${client?.firstName} ${client?.lastName}`.trim(),
    });
  } catch (error) {
    logger.error('Failed to send application viewed notification', error);
    // Don't fail the request if notification fails
  }
  
  logger.info('Application marked as viewed successfully', {
    userId,
    applicationId,
    orderId,
    viewedAt: updatedApplication.viewedAt,
  });
  
  return success({
    message: 'Application marked as viewed',
    viewedAt: updatedApplication.viewedAt
  });
}

export const handler = withErrorHandler(withAuth(markApplicationViewedHandler, { roles: ['CLIENT'] }));