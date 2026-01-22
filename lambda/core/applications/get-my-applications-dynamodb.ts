import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const appRepo = new ApplicationRepository();
    const applications = await appRepo.findByMaster(decoded.userId);

    return {
      statusCode: 200,
      body: JSON.stringify(applications),
    };
  } catch (error: any) {
    console.error('Get my applications error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
