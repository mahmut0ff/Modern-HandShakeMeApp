import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '../shared/repositories/notification.repository';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const notificationRepo = new NotificationRepository();
    await notificationRepo.deleteAllForUser(decoded.userId);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error: any) {
    console.error('Delete all notifications error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
