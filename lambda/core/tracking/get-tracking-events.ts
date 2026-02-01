// Get tracking events

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { LocationRepository } from '@/shared/repositories/location.repository';

const querySchema = z.object({
  trackingId: z.string(),
  eventTypes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.string().optional(),
});

async function getTrackingEventsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  const queryParams = event.queryStringParameters || {};
  
  logger.info('Get tracking events request', { userId, queryParams });
  
  const params = querySchema.parse(queryParams);
  const limit = params.limit ? parseInt(params.limit) : 100;
  
  const locationRepository = new LocationRepository();
  
  try {
    // Get tracking session to check permissions
    const tracking = await locationRepository.getLocationTracking(params.trackingId);
    
    if (!tracking) {
      return notFound('Tracking session not found');
    }
    
    // Check permissions
    const canView = 
      tracking.masterId === userId ||
      (userRole === 'CLIENT' && tracking.settings?.shareWithClient !== false) ||
      userRole === 'ADMIN';
    
    if (!canView) {
      return forbidden('You do not have permission to view these events');
    }
    
    // Get events
    const events = await locationRepository.getTrackingEvents(params.trackingId, limit);
    
    // Filter by event types if specified
    let filteredEvents = events;
    if (params.eventTypes) {
      const types = params.eventTypes.split(',');
      filteredEvents = events.filter(e => types.includes(e.eventType));
    }
    
    // Filter by time range if specified
    if (params.startTime || params.endTime) {
      filteredEvents = filteredEvents.filter(e => {
        const eventTime = new Date(e.timestamp).getTime();
        if (params.startTime && eventTime < new Date(params.startTime).getTime()) {
          return false;
        }
        if (params.endTime && eventTime > new Date(params.endTime).getTime()) {
          return false;
        }
        return true;
      });
    }
    
    logger.info('Tracking events retrieved', { 
      userId, 
      trackingId: params.trackingId,
      count: filteredEvents.length 
    });
    
    return success({
      events: filteredEvents,
      totalCount: filteredEvents.length,
    });
  } catch (error) {
    logger.error('Failed to get tracking events', error, { userId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getTrackingEventsHandler)
  )
);
