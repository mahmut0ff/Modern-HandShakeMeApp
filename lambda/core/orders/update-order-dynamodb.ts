import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { OrderRepository } from '../shared/repositories/order.repository';
import { verifyToken } from '../shared/services/token';

const updateOrderSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  hideAddress: z.boolean().optional(),
  budgetType: z.enum(['FIXED', 'RANGE', 'NEGOTIABLE']).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  isUrgent: z.boolean().optional(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const orderId = event.pathParameters?.id;
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

    const body = JSON.parse(event.body || '{}');
    const data = updateOrderSchema.parse(body);

    const updated = await orderRepo.update(orderId, data);

    return {
      statusCode: 200,
      body: JSON.stringify(updated),
    };
  } catch (error: any) {
    console.error('Update order error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
