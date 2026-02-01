// Delete all notifications with DynamoDB

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NotificationRepository } from '@/shared/repositories/notification.repository';
import { success, unauthorized, serverError } from '@/shared/utils/response';
import { logger } from '@/shared/utils/logger';
import { verifyJWT } from '@/shared/utils/jwt';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return unauthorized('Authorization token required');
    }

    const decoded = verifyJWT(token);
    const userId = decoded.userId;
    
    logger.info('Delete all notifications request', { userId });
    
    const notificationRepo = new NotificationRepository();
    const deletedCount = await notificationRepo.deleteAllForUser(userId);

    logger.info('All notifications deleted', { userId, deletedCount });

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error: any) {
    logger.error('Delete all notifications error:', { error: error.message });
    return serverError('Failed to delete notifications');
  }
}
