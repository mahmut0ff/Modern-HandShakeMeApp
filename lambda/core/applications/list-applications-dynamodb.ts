import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { formatPaginatedResponse } from '../shared/utils/response-formatter';
import { OrderRepository } from '../shared/repositories/order.repository';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const orderId = event.pathParameters?.orderId;

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

    const appRepo = new ApplicationRepository();
    const applications = await appRepo.findByOrder(orderId);

    return {
      statusCode: 200,
      body: JSON.stringify(applications),
    };
  } catch (error: any) {
    console.error('List applications error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
