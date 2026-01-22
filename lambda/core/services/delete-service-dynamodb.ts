import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceRepository } from '../shared/repositories/service.repository';
import { verifyToken } from '../shared/services/token';

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

    await serviceRepo.delete(decoded.userId, serviceId);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error: any) {
    console.error('Delete service error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
