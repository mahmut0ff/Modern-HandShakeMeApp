import type { APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function deleteOrderHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const orderId = event.pathParameters?.id || event.pathParameters?.orderId;

  if (!orderId) {
    return badRequest('Order ID is required');
  }

  logger.info('Delete order request', { userId, orderId });

  const orderRepo = new OrderRepository();
  const order = await orderRepo.findById(orderId);

  if (!order) {
    return notFound('Order not found');
  }

  if (order.clientId !== userId) {
    return forbidden('You can only delete your own orders');
  }

  // Optional: Prevent deleting orders in progress?
  if (order.status === 'IN_PROGRESS') {
    return badRequest('Cannot delete an order that is in progress');
  }

  await orderRepo.delete(orderId);

  return success({ message: 'Order deleted successfully' });
}

export const handler = withErrorHandler(withAuth(deleteOrderHandler, { roles: ['CLIENT', 'MASTER'] }));
