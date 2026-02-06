import { APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { OrderRepository } from '../shared/repositories/order.repository';
import { formatPaginatedResponse, formatOrderObject } from '../shared/utils/response-formatter';

const orderRepository = new OrderRepository();

const getMyOrdersHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;
  
  const { status } = event.queryStringParameters || {};

  logger.info('Get my orders request', { userId, status });

  // Get orders by client
  const orders = await orderRepository.findByClient(userId);
  
  let filteredOrders = orders;
  if (status) {
    filteredOrders = orders.filter(o => o.status === status);
  }

  const formattedOrders = filteredOrders.map(formatOrderObject);
  const response = formatPaginatedResponse(formattedOrders, formattedOrders.length);

  return success(response);
};

export const handler = withErrorHandler(withAuth(getMyOrdersHandler));
