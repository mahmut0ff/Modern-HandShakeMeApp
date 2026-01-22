import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { verifyToken } from '../shared/services/token';

const updateServiceSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(2000).optional(),
  priceFrom: z.number().positive().optional(),
  priceTo: z.number().positive().optional(),
  duration: z.string().optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const serviceId = event.pathParameters?.id;

    if (!serviceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Service ID required' }) };
    }

    const serviceRepo = new ServiceRepository();
    const service = await serviceRepo.findById(decoded.userId, serviceId);

    if (!service) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Service not found' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const data = updateServiceSchema.parse(body);

    const updated = await serviceRepo.update(decoded.userId, serviceId, data);

    return {
      statusCode: 200,
      body: JSON.stringify(updated),
    };
  } catch (error: any) {
    console.error('Update service error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
