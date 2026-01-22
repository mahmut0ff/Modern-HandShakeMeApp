import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { verifyToken } from '../shared/services/token';

const createServiceSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  priceFrom: z.number().positive(),
  priceTo: z.number().positive().optional(),
  duration: z.string(),
  images: z.array(z.string()).optional(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const data = createServiceSchema.parse(body);

    const serviceRepo = new ServiceRepository();
    const service = await serviceRepo.create({
      ...data,
      masterId: decoded.userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(service),
    };
  } catch (error: any) {
    console.error('Create service error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
