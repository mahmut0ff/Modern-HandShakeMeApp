// Get time tracking statistics

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { TimeTrackingRepository } from '@/shared/repositories/time-tracking.repository';

const querySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  projectId: z.string().optional(),
  bookingId: z.string().optional(),
});

async function getStatisticsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const queryParams = event.queryStringParameters || {};
  
  logger.info('Get statistics request', { userId, queryParams });
  
  const params = querySchema.parse(queryParams);
  
  // Calculate date range based on period
  let startDate = params.startDate;
  let endDate = params.endDate;
  
  if (params.period && !startDate) {
    const now = new Date();
    endDate = now.toISOString();
    
    switch (params.period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
        break;
    }
  }
  
  const timeTrackingRepo = new TimeTrackingRepository();
  
  try {
    // Get basic statistics
    const stats = await timeTrackingRepo.getSessionStatistics(userId, startDate, endDate);
    
    // Get all sessions for detailed analysis
    const sessions = await timeTrackingRepo.findSessionsByMaster(userId, {
      startDate,
      endDate,
      projectId: params.projectId,
      bookingId: params.bookingId,
      limit: 1000,
    });
    
    // Calculate additional metrics
    const averageSessionDuration = sessions.length > 0 
      ? stats.totalHours / sessions.length 
      : 0;
    
    // Find most productive day
    const dailyMap = new Map<string, { sessions: number; hours: number; earnings: number }>();
    sessions.forEach(session => {
      const date = session.startTime.split('T')[0];
      const existing = dailyMap.get(date) || { sessions: 0, hours: 0, earnings: 0 };
      
      existing.sessions++;
      if (session.totalMinutes) {
        existing.hours += session.totalMinutes / 60;
      }
      if (session.billableHours && session.hourlyRate) {
        existing.earnings += session.billableHours * session.hourlyRate;
      }
      
      dailyMap.set(date, existing);
    });
    
    let mostProductiveDay = '';
    let maxHours = 0;
    dailyMap.forEach((value, date) => {
      if (value.hours > maxHours) {
        maxHours = value.hours;
        mostProductiveDay = date;
      }
    });
    
    // Find most common task type
    let mostCommonTaskType = 'WORK';
    let maxCount = 0;
    Object.entries(stats.byTaskType).forEach(([taskType, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostCommonTaskType = taskType;
      }
    });
    
    // Calculate this week/month stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let sessionsThisWeek = 0;
    let sessionsThisMonth = 0;
    let hoursThisWeek = 0;
    let hoursThisMonth = 0;
    let earningsThisWeek = 0;
    let earningsThisMonth = 0;
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      const hours = session.totalMinutes ? session.totalMinutes / 60 : 0;
      const earnings = session.billableHours && session.hourlyRate 
        ? session.billableHours * session.hourlyRate 
        : 0;
      
      if (sessionDate >= weekAgo) {
        sessionsThisWeek++;
        hoursThisWeek += hours;
        earningsThisWeek += earnings;
      }
      
      if (sessionDate >= monthAgo) {
        sessionsThisMonth++;
        hoursThisMonth += hours;
        earningsThisMonth += earnings;
      }
    });
    
    // Task type breakdown
    const taskTypeBreakdown = Object.entries(stats.byTaskType).map(([taskType, data]) => ({
      taskType,
      sessions: data.count,
      hours: data.hours,
      percentage: stats.totalSessions > 0 ? (data.count / stats.totalSessions) * 100 : 0,
    }));
    
    // Daily stats
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Weekly stats (group by week)
    const weeklyMap = new Map<string, { sessions: number; hours: number; earnings: number }>();
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const existing = weeklyMap.get(weekKey) || { sessions: 0, hours: 0, earnings: 0 };
      existing.sessions++;
      if (session.totalMinutes) {
        existing.hours += session.totalMinutes / 60;
      }
      if (session.billableHours && session.hourlyRate) {
        existing.earnings += session.billableHours * session.hourlyRate;
      }
      
      weeklyMap.set(weekKey, existing);
    });
    
    const weeklyStats = Array.from(weeklyMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));
    
    // Monthly stats (group by month)
    const monthlyMap = new Map<string, { sessions: number; hours: number; earnings: number }>();
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyMap.get(monthKey) || { sessions: 0, hours: 0, earnings: 0 };
      existing.sessions++;
      if (session.totalMinutes) {
        existing.hours += session.totalMinutes / 60;
      }
      if (session.billableHours && session.hourlyRate) {
        existing.earnings += session.billableHours * session.hourlyRate;
      }
      
      monthlyMap.set(monthKey, existing);
    });
    
    const monthlyStats = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    logger.info('Statistics retrieved', { userId, totalSessions: stats.totalSessions });
    
    return success({
      totalSessions: stats.totalSessions,
      totalHours: stats.totalHours,
      totalBillableHours: stats.totalBillableHours,
      totalEarnings: stats.totalEarnings,
      averageSessionDuration,
      mostProductiveDay,
      mostCommonTaskType,
      sessionsThisWeek,
      sessionsThisMonth,
      hoursThisWeek,
      hoursThisMonth,
      earningsThisWeek,
      earningsThisMonth,
      taskTypeBreakdown,
      dailyStats,
      weeklyStats,
      monthlyStats,
    });
  } catch (error) {
    logger.error('Failed to get statistics', error, { userId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getStatisticsHandler)
  )
);
