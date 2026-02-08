import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { verifyAccessToken } from '../shared/services/auth-token.service';
import { logger } from '../shared/utils/logger';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const orderId = event.pathParameters?.orderId || event.pathParameters?.id;
    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Order ID required' }) };
    }

    const orderRepo = new OrderRepository();
    const order = await orderRepo.findById(orderId);

    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    // Attempt to get userId for unique view counting
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = await verifyAccessToken(token);
        if (decoded && decoded.userId) {
          // Record unique view
          await orderRepo.recordUniqueView(orderId, decoded.userId);
        }
      }
    } catch (authError) {
      // Ignore auth errors for view counting (public endpoint)
      logger.debug('Auth failed for view counting', { orderId });
    }

    // Refetch order to get updated viewsCount
    const updatedOrder = await orderRepo.findById(orderId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOrder || order),
    };
  } catch (error: any) {
    console.error('Get order error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
