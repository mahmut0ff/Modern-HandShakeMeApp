import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const orderId = event.pathParameters?.orderId || event.pathParameters?.id;
    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Order ID required' }) };
    }

    const orderRepo = new OrderRepository();
    const order = await orderRepo.findById(orderId);

    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    if (order.clientId !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    await orderRepo.delete(orderId);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error: any) {
    console.error('Delete order error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
