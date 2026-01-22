import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Order ID required' }) };
    }

    const orderRepo = new OrderRepository();
    const order = await orderRepo.findById(orderId);

    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    // Increment view count
    await orderRepo.update(orderId, {
      viewsCount: order.viewsCount + 1,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(order),
    };
  } catch (error: any) {
    console.error('Get order error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
