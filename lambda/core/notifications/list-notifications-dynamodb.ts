import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '../shared/repositories/notification.repository';
import { formatPaginatedResponse } from '../shared/utils/response-formatter';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const notificationRepo = new NotificationRepository();
    const notifications = await notificationRepo.findByUser(decoded.userId);

    return {
      statusCode: 200,
      body: JSON.stringify(notifications),
    };
  } catch (error: any) {
    console.error('List notifications error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
