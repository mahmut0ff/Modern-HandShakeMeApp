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
    const serviceRepo = new ServiceRepository();
    const services = await serviceRepo.findByMaster(decoded.userId);

    return {
      statusCode: 200,
      body: JSON.stringify(services),
    };
  } catch (error: any) {
    console.error('Get my services error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
