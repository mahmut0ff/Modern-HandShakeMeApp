import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { verifyToken } from '../shared/services/token';

const createApplicationSchema = z.object({
  orderId: z.string(),
  coverLetter: z.string().min(50).max(2000),
  proposedPrice: z.number().positive(),
  proposedDurationDays: z.number().positive(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const data = createApplicationSchema.parse(body);

    const orderRepo = new OrderRepository();
    const order = await orderRepo.findById(data.orderId);

    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    if (order.status !== 'ACTIVE') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Order is not active' }) };
    }

    const appRepo = new ApplicationRepository();
    const application = await appRepo.create({
      ...data,
      masterId: decoded.userId,
    });

    // Update order applications count
    await orderRepo.update(data.orderId, {
      applicationsCount: order.applicationsCount + 1,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(application),
    };
  } catch (error: any) {
    console.error('Create application error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
