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
    const notificationId = event.pathParameters?.id;

    if (!notificationId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Notification ID required' }) };
    }

    const notificationRepo = new NotificationRepository();
    const notification = await notificationRepo.findById(decoded.userId, notificationId);

    if (!notification) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Notification not found' }) };
    }

    const updated = await notificationRepo.update(decoded.userId, notificationId, {
      isRead: true,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(updated),
    };
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
