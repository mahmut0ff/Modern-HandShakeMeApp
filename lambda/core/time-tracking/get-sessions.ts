// Get time tracking sessions with filters

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { TimeTrackingRepository } from '@/shared/repositories/time-tracking.repository';

const querySchema = z.object({
  projectId: z.string().optional(),
  bookingId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  taskType: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

async function getSessionsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const queryParams = event.queryStringParameters || {};
  
  logger.info('Get sessions request', { userId, queryParams });
  
  const params = querySchema.parse(queryParams);
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '50');
  
  const timeTrackingRepo = new TimeTrackingRepository();
  
  try {
    const sessions = await timeTrackingRepo.findSessionsByMaster(userId, {
      projectId: params.projectId,
      bookingId: params.bookingId,
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status,
      limit: limit * page, // Get more for pagination
    });
    
    // Calculate totals
    let totalHours = 0;
    let totalBillableHours = 0;
    let totalEarnings = 0;
    
    sessions.forEach(session => {
      if (session.totalMinutes) {
        totalHours += session.totalMinutes / 60;
      }
      if (session.billableHours) {
        totalBillableHours += session.billableHours;
      }
      if (session.billableHours && session.hourlyRate) {
        totalEarnings += session.billableHours * session.hourlyRate;
      }
    });
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = sessions.slice(startIndex, endIndex);
    
    logger.info('Sessions retrieved', { 
      userId, 
      totalCount: sessions.length,
      returnedCount: paginatedSessions.length 
    });
    
    return success({
      sessions: paginatedSessions,
      totalCount: sessions.length,
      totalHours,
      totalBillableHours,
      totalEarnings,
      page,
      limit,
      hasMore: endIndex < sessions.length,
    });
  } catch (error) {
    logger.error('Failed to get sessions', error, { userId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getSessionsHandler)
  )
);
