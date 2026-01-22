import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { OrderRepository } from '../shared/repositories/order.repository';
import { verifyToken } from '../shared/services/token';

const createOrderSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  city: z.string(),
  address: z.string(),
  hideAddress: z.boolean().optional(),
  budgetType: z.enum(['FIXED', 'RANGE', 'NEGOTIABLE']),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isUrgent: z.boolean().optional(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const data = createOrderSchema.parse(body);

    const orderRepo = new OrderRepository();
    const order = await orderRepo.create({
      ...data,
      clientId: decoded.userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(order),
    };
  } catch (error: any) {
    console.error('Create order error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
