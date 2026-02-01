// Set user online status

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { validate } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';

const onlineStatusSchema = z.object({
  isOnline: z.boolean(),
});

async function setOnlineStatusHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Set online status request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(onlineStatusSchema, body);
  
  // Note: In a real implementation, this would update user status in DynamoDB
  // and potentially broadcast the status change to connected WebSocket clients
  // For now, we'll just log and return success
  
  logger.info('Online status updated', { userId, isOnline: data.isOnline });
  
  return success({ message: 'Online status updated', isOnline: data.isOnline });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(setOnlineStatusHandler)));
