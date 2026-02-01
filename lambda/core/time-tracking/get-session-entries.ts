// Get time entries for a specific session

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { TimeTrackingRepository } from '@/shared/repositories/time-tracking.repository';

async function getSessionEntriesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const sessionId = event.pathParameters?.sessionId;
  
  if (!sessionId) {
    return notFound('Session ID is required');
  }
  
  logger.info('Get session entries request', { userId, sessionId });
  
  const timeTrackingRepo = new TimeTrackingRepository();
  
  try {
    // Get session
    const session = await timeTrackingRepo.findSessionById(sessionId);
    
    if (!session) {
      return notFound('Session not found');
    }
    
    if (session.masterId !== userId) {
      return forbidden('Access denied');
    }
    
    // Get entries
    const entries = await timeTrackingRepo.findEntriesBySession(sessionId);
    
    // Build timeline
    const timeline = entries.map(entry => {
      let description = '';
      let duration: number | undefined;
      
      switch (entry.entryType) {
        case 'START':
          description = 'Session started';
          break;
        case 'PAUSE':
          description = 'Session paused';
          break;
        case 'RESUME':
          description = 'Session resumed';
          break;
        case 'STOP':
          description = 'Session completed';
          break;
        default:
          description = entry.notes || 'Activity recorded';
      }
      
      return {
        timestamp: entry.timestamp,
        type: entry.entryType,
        description,
        duration,
        location: entry.location,
        notes: entry.notes,
      };
    });
    
    // Calculate durations between entries
    for (let i = 0; i < timeline.length - 1; i++) {
      const current = timeline[i];
      const next = timeline[i + 1];
      
      if (current.type === 'START' || current.type === 'RESUME') {
        const currentTime = new Date(current.timestamp).getTime();
        const nextTime = new Date(next.timestamp).getTime();
        const durationMs = nextTime - currentTime;
        current.duration = Math.floor(durationMs / 1000 / 60); // minutes
      }
    }
    
    logger.info('Session entries retrieved', { 
      sessionId, 
      userId,
      entriesCount: entries.length 
    });
    
    return success({
      session,
      entries,
      timeline,
    });
  } catch (error) {
    logger.error('Failed to get session entries', error, { userId, sessionId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getSessionEntriesHandler)
  )
);
