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
    const notifications = await notificationRepo.findByUser(decoded.userId);

    // Mark all as read
    for (const notification of notifications) {
      if (!notification.isRead) {
        await notificationRepo.update(decoded.userId, notification.id, { isRead: true });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'All notifications marked as read' }),
    };
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
