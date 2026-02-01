import { APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function getOrderApplicationsHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const orderId = event.pathParameters?.id;
  
  if (!orderId) {
    return badRequest('Order ID is required');
  }
  
  logger.info('Get order applications request', { userId, orderId });
  
  const orderRepo = new OrderRepository();
  const applicationRepo = new ApplicationRepository();
  
  // Get order to verify ownership
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return notFound('Order not found');
  }
  
  // Only order owner can view applications
  if (event.auth.role === 'CLIENT' && order.clientId !== userId) {
    return forbidden('You can only view applications for your own orders');
  }
  
  // Get applications for the order
  const applications = await applicationRepo.findByOrder(orderId);
  
  logger.info('Order applications retrieved successfully', {
    userId,
    orderId,
    count: applications.length,
  });
  
  return success(applications);
}

export const handler = withErrorHandler(withAuth(getOrderApplicationsHandler));