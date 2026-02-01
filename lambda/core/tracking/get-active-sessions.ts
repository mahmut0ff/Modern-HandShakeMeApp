// Get active tracking sessions

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { LocationRepository } from '@/shared/repositories/location.repository';

async function getActiveSessionsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const queryParams = event.queryStringParameters || {};
  
  logger.info('Get active tracking sessions request', { userId, queryParams });
  
  const locationRepository = new LocationRepository();
  
  try {
    const masterId = queryParams.masterId;
    const clientId = queryParams.clientId;
    
    // For now, we'll get active sessions by master
    // In production, this would also filter by client access
    let sessions: any[] = [];
    
    if (masterId) {
      const session = await locationRepository.findActiveTrackingByMaster(masterId);
      if (session) {
        sessions = [session];
      }
    }
    
    logger.info('Active sessions retrieved', { 
      userId, 
      count: sessions.length 
    });
    
    return success({
      sessions,
      totalCount: sessions.length,
    });
  } catch (error) {
    logger.error('Failed to get active sessions', error, { userId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getActiveSessionsHandler)
  )
);
