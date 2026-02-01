// Get active time tracking session

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { TimeTrackingRepository } from '@/shared/repositories/time-tracking.repository';

async function getActiveSessionHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get active session request', { userId });
  
  const timeTrackingRepo = new TimeTrackingRepository();
  
  try {
    const session = await timeTrackingRepo.findActiveSessionByMaster(userId);
    
    if (!session) {
      return success({
        session: null,
        message: 'No active session found',
      });
    }
    
    // Calculate elapsed time
    const now = new Date();
    const startTime = new Date(session.startTime);
    const elapsedMs = now.getTime() - startTime.getTime();
    
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    logger.info('Active session found', { sessionId: session.id, userId });
    
    return success({
      session,
      elapsedTime: { hours, minutes, seconds },
    });
  } catch (error) {
    logger.error('Failed to get active session', error, { userId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getActiveSessionHandler)
  )
);
