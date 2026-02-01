// Time tracking for projects and bookings

import type { APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { success, badRequest, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';
import { NotificationService } from '@/shared/services/notification';
import { WebSocketService } from '@/shared/services/websocket.service';
import { TimeTrackingRepository, TimeTrackingSession } from '@/shared/repositories/time-tracking.repository';
import { getItem } from '@/shared/db/dynamodb-client';

const timeTrackingSchema = z.object({
  action: z.enum(['START_SESSION', 'PAUSE_SESSION', 'RESUME_SESSION', 'STOP_SESSION', 'ADD_MANUAL_ENTRY', 'UPDATE_SESSION', 'DELETE_SESSION']),
  projectId: z.string().optional(),
  bookingId: z.string().optional(),
  sessionId: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  description: z.string().optional(),
  taskType: z.enum(['PREPARATION', 'TRAVEL', 'WORK', 'BREAK', 'CLEANUP', 'DOCUMENTATION', 'OTHER']).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  billableHours: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
    description: z.string().optional(),
  })).optional(),
  autoTracking: z.object({
    enabled: z.boolean().default(false),
    pauseOnIdle: z.boolean().default(true),
    idleThresholdMinutes: z.number().min(1).max(60).default(15),
    autoStopAfterHours: z.number().min(1).max(24).default(12),
    trackLocation: z.boolean().default(true),
    requirePhotos: z.boolean().default(false),
  }).optional(),
});

async function manageTimeSessionsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  if (userRole !== 'MASTER') {
    return forbidden('Only masters can manage time tracking');
  }
  
  logger.info('Time tracking request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(timeTrackingSchema, body);
  
  const timeTrackingRepo = new TimeTrackingRepository();
  const notificationService = new NotificationService();
  const webSocketService = new WebSocketService();
  
  try {
    switch (data.action) {
      case 'START_SESSION':
        return await startTimeSession(userId, data, timeTrackingRepo, notificationService, webSocketService);
      case 'PAUSE_SESSION':
        return await pauseTimeSession(userId, data, timeTrackingRepo, webSocketService);
      case 'RESUME_SESSION':
        return await resumeTimeSession(userId, data, timeTrackingRepo, webSocketService);
      case 'STOP_SESSION':
        return await stopTimeSession(userId, data, timeTrackingRepo, notificationService, webSocketService);
      case 'ADD_MANUAL_ENTRY':
        return await addManualTimeEntry(userId, data, timeTrackingRepo, notificationService);
      case 'UPDATE_SESSION':
        return await updateTimeSession(userId, data, timeTrackingRepo);
      case 'DELETE_SESSION':
        return await deleteTimeSession(userId, data, timeTrackingRepo);
      default:
        return badRequest('Invalid action');
    }
  } catch (error) {
    logger.error('Time tracking request failed', { userId, action: data.action, error });
    throw error;
  }
}

async function startTimeSession(
  userId: string,
  data: any,
  timeTrackingRepo: TimeTrackingRepository,
  notificationService: NotificationService,
  webSocketService: WebSocketService
): Promise<APIGatewayProxyResult> {
  if (!data.projectId && !data.bookingId) {
    return badRequest('Project ID or Booking ID is required');
  }
  
  // Verify project/booking exists and belongs to master
  let clientId: string | null = null;
  
  if (data.projectId) {
    const project = await getItem({
      PK: `PROJECT#${data.projectId}`,
      SK: 'DETAILS',
    });
    
    if (!project || project.masterId !== userId) {
      return forbidden('Project not found or access denied');
    }
    
    if (!['IN_PROGRESS', 'REVIEW'].includes(project.status)) {
      return badRequest('Can only track time for active projects');
    }
    
    clientId = project.clientId;
  }
  
  if (data.bookingId) {
    const booking = await getItem({
      PK: `BOOKING#${data.bookingId}`,
      SK: 'DETAILS',
    });
    
    if (!booking || booking.masterId !== userId) {
      return forbidden('Booking not found or access denied');
    }
    
    if (!['CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
      return badRequest('Can only track time for active bookings');
    }
    
    clientId = booking.clientId;
  }
  
  // Check if there's already an active session
  const activeSession = await timeTrackingRepo.findActiveSessionByMaster(userId);
  
  if (activeSession) {
    return badRequest('You already have an active time tracking session. Please stop it first.');
  }
  
  // Create new time tracking session
  const startTime = data.startTime ? new Date(data.startTime).toISOString() : new Date().toISOString();
  
  const session = await timeTrackingRepo.createSession({
    masterId: userId,
    projectId: data.projectId,
    bookingId: data.bookingId,
    status: 'ACTIVE',
    taskType: data.taskType || 'WORK',
    startTime,
    description: data.description,
    location: data.location,
    hourlyRate: data.hourlyRate,
    autoTrackingSettings: data.autoTracking || {},
  });
  
  // Create initial time entry
  await timeTrackingRepo.createEntry({
    sessionId: session.id,
    entryType: 'START',
    timestamp: startTime,
    location: data.location,
    notes: 'Session started',
  });
  
  // Notify client if enabled
  if (clientId) {
    await notificationService.sendTimeTrackingNotification(
      clientId,
      'SESSION_STARTED',
      {
        masterId: userId,
        sessionId: session.id,
        projectId: data.projectId,
        bookingId: data.bookingId,
        taskType: data.taskType,
        startTime,
      }
    );
    
    // Broadcast via WebSocket
    await webSocketService.broadcastTimeTrackingUpdate(clientId, {
      sessionId: session.id,
      status: 'ACTIVE',
      startTime,
      taskType: data.taskType,
      description: data.description,
    });
  }
  
  logger.info('Time tracking session started', { 
    sessionId: session.id, 
    masterId: userId,
    projectId: data.projectId,
    bookingId: data.bookingId 
  });
  
  return success({
    session: {
      id: session.id,
      status: session.status,
      taskType: session.taskType,
      startTime: session.startTime,
      description: session.description,
      location: session.location,
      hourlyRate: session.hourlyRate,
    },
    message: 'Time tracking session started successfully',
  });
}

async function pauseTimeSession(
  userId: string,
  data: any,
  timeTrackingRepo: TimeTrackingRepository,
  webSocketService: WebSocketService
): Promise<APIGatewayProxyResult> {
  let sessionId = data.sessionId;
  
  if (!sessionId) {
    // Find active session
    const activeSession = await timeTrackingRepo.findActiveSessionByMaster(userId);
    
    if (!activeSession) {
      return notFound('No active time tracking session found');
    }
    
    sessionId = activeSession.id;
  }
  
  // Get session
  const session = await timeTrackingRepo.findSessionById(sessionId);
  
  if (!session || session.masterId !== userId) {
    return forbidden('Session not found or access denied');
  }
  
  if (session.status !== 'ACTIVE') {
    return badRequest('Session is not active');
  }
  
  // Pause session
  const pauseTime = new Date().toISOString();
  await timeTrackingRepo.updateSession(session.id, {
    status: 'PAUSED',
    lastPauseTime: pauseTime,
  });
  
  // Create pause entry
  await timeTrackingRepo.createEntry({
    sessionId: session.id,
    entryType: 'PAUSE',
    timestamp: pauseTime,
    location: data.location,
    notes: data.notes || 'Session paused',
  });
  
  // Calculate elapsed time
  const elapsedTime = calculateElapsedTime(session);
  
  // Notify client
  const clientId = await getClientIdFromSession(session);
  if (clientId) {
    await webSocketService.broadcastTimeTrackingUpdate(clientId, {
      sessionId: session.id,
      status: 'PAUSED',
      pauseTime,
      elapsedTime,
    });
  }
  
  logger.info('Time tracking session paused', { 
    sessionId: session.id,
    masterId: userId,
    elapsedTime 
  });
  
  return success({
    session: {
      id: session.id,
      status: 'PAUSED',
      pauseTime,
      elapsedTime,
    },
    message: 'Time tracking session paused successfully',
  });
}

async function resumeTimeSession(
  userId: string,
  data: any,
  timeTrackingRepo: TimeTrackingRepository,
  webSocketService: WebSocketService
): Promise<APIGatewayProxyResult> {
  if (!data.sessionId) {
    return badRequest('Session ID is required');
  }
  
  // Get session
  const session = await timeTrackingRepo.findSessionById(data.sessionId);
  
  if (!session || session.masterId !== userId) {
    return forbidden('Session not found or access denied');
  }
  
  if (session.status !== 'PAUSED') {
    return badRequest('Session is not paused');
  }
  
  // Resume session
  const resumeTime = new Date().toISOString();
  await timeTrackingRepo.updateSession(session.id, {
    status: 'ACTIVE',
    lastResumeTime: resumeTime,
  });
  
  // Create resume entry
  await timeTrackingRepo.createEntry({
    sessionId: session.id,
    entryType: 'RESUME',
    timestamp: resumeTime,
    location: data.location,
    notes: data.notes || 'Session resumed',
  });
  
  // Notify client
  const clientId = await getClientIdFromSession(session);
  if (clientId) {
    await webSocketService.broadcastTimeTrackingUpdate(clientId, {
      sessionId: session.id,
      status: 'ACTIVE',
      resumeTime,
    });
  }
  
  logger.info('Time tracking session resumed', { 
    sessionId: session.id,
    masterId: userId 
  });
  
  return success({
    session: {
      id: session.id,
      status: 'ACTIVE',
      resumeTime,
    },
    message: 'Time tracking session resumed successfully',
  });
}

async function stopTimeSession(
  userId: string,
  data: any,
  timeTrackingRepo: TimeTrackingRepository,
  notificationService: NotificationService,
  webSocketService: WebSocketService
): Promise<APIGatewayProxyResult> {
  let sessionId = data.sessionId;
  
  if (!sessionId) {
    // Find active session
    const activeSession = await timeTrackingRepo.findActiveSessionByMaster(userId);
    
    if (!activeSession) {
      return notFound('No active time tracking session found');
    }
    
    sessionId = activeSession.id;
  }
  
  // Get session with all entries
  const session = await timeTrackingRepo.findSessionById(sessionId);
  
  if (!session || session.masterId !== userId) {
    return forbidden('Session not found or access denied');
  }
  
  if (!['ACTIVE', 'PAUSED'].includes(session.status)) {
    return badRequest('Session is not active or paused');
  }
  
  // Get time entries
  const timeEntries = await timeTrackingRepo.findEntriesBySession(sessionId);
  
  // Stop session
  const endTime = data.endTime ? new Date(data.endTime).toISOString() : new Date().toISOString();
  const totalTime = calculateTotalTime({ ...session, timeEntries }, new Date(endTime));
  const billableHours = data.billableHours !== undefined ? data.billableHours : totalTime.hours;
  
  await timeTrackingRepo.updateSession(session.id, {
    status: 'COMPLETED',
    endTime,
    totalMinutes: totalTime.hours * 60 + totalTime.minutes,
    billableHours,
    finalNotes: data.notes,
    attachments: data.attachments || session.attachments || [],
  });
  
  // Create stop entry
  await timeTrackingRepo.createEntry({
    sessionId: session.id,
    entryType: 'STOP',
    timestamp: endTime,
    location: data.location,
    notes: data.notes || 'Session completed',
  });
  
  // Calculate billing amount
  const billingAmount = session.hourlyRate ? billableHours * session.hourlyRate : 0;
  
  // Create time tracking summary
  const summary = {
    sessionId: session.id,
    totalTime: totalTime,
    billableHours,
    hourlyRate: session.hourlyRate,
    billingAmount,
    taskType: session.taskType,
    description: session.description,
    startTime: session.startTime,
    endTime,
    attachments: data.attachments || session.attachments || [],
  };
  
  // Notify client
  const clientId = await getClientIdFromSession(session);
  if (clientId) {
    await notificationService.sendTimeTrackingNotification(
      clientId,
      'SESSION_COMPLETED',
      summary
    );
    
    await webSocketService.broadcastTimeTrackingUpdate(clientId, {
      sessionId: session.id,
      status: 'COMPLETED',
      endTime,
      totalTime,
      billableHours,
      billingAmount,
    });
  }
  
  logger.info('Time tracking session completed', { 
    sessionId: session.id,
    masterId: userId,
    totalMinutes: totalTime.hours * 60 + totalTime.minutes,
    billableHours,
    billingAmount 
  });
  
  return success({
    session: {
      id: session.id,
      status: 'COMPLETED',
      startTime: session.startTime,
      endTime,
      totalTime,
      billableHours,
      billingAmount,
      taskType: session.taskType,
      description: session.description,
    },
    summary,
    message: 'Time tracking session completed successfully',
  });
}

async function addManualTimeEntry(
  userId: string,
  data: any,
  timeTrackingRepo: TimeTrackingRepository,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.projectId && !data.bookingId) {
    return badRequest('Project ID or Booking ID is required');
  }
  
  if (!data.startTime || !data.endTime) {
    return badRequest('Start time and end time are required for manual entries');
  }
  
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  
  if (startTime >= endTime) {
    return badRequest('End time must be after start time');
  }
  
  // Verify project/booking access
  let clientId: string | null = null;
  
  if (data.projectId) {
    const project = await getItem({
      PK: `PROJECT#${data.projectId}`,
      SK: 'DETAILS',
    });
    
    if (!project || project.masterId !== userId) {
      return forbidden('Project not found or access denied');
    }
    
    clientId = project.clientId;
  }
  
  if (data.bookingId) {
    const booking = await getItem({
      PK: `BOOKING#${data.bookingId}`,
      SK: 'DETAILS',
    });
    
    if (!booking || booking.masterId !== userId) {
      return forbidden('Booking not found or access denied');
    }
    
    clientId = booking.clientId;
  }
  
  // Calculate duration
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const durationHours = durationMinutes / 60;
  const billableHours = data.billableHours !== undefined ? data.billableHours : durationHours;
  
  // Create manual time entry session
  const session = await timeTrackingRepo.createSession({
    masterId: userId,
    projectId: data.projectId,
    bookingId: data.bookingId,
    status: 'COMPLETED',
    taskType: data.taskType || 'WORK',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    totalMinutes: durationMinutes,
    billableHours,
    hourlyRate: data.hourlyRate,
    description: data.description,
    finalNotes: data.notes,
    attachments: data.attachments || [],
    isManualEntry: true,
  });
  
  // Create time entries
  await timeTrackingRepo.createEntry({
    sessionId: session.id,
    entryType: 'START',
    timestamp: startTime.toISOString(),
    location: data.location,
    notes: 'Manual entry - start',
  });
  
  await timeTrackingRepo.createEntry({
    sessionId: session.id,
    entryType: 'STOP',
    timestamp: endTime.toISOString(),
    location: data.location,
    notes: data.notes || 'Manual entry - end',
  });
  
  // Calculate billing
  const billingAmount = session.hourlyRate ? billableHours * session.hourlyRate : 0;
  
  // Notify client if enabled
  if (clientId) {
    await notificationService.sendTimeTrackingNotification(
      clientId,
      'MANUAL_ENTRY_ADDED',
      {
        masterId: userId,
        sessionId: session.id,
        projectId: data.projectId,
        bookingId: data.bookingId,
        durationMinutes,
        billableHours,
        billingAmount,
      }
    );
  }
  
  logger.info('Manual time entry created', { 
    sessionId: session.id,
    masterId: userId,
    durationMinutes,
    billableHours,
    billingAmount 
  });
  
  return success({
    session: {
      id: session.id,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      totalMinutes: session.totalMinutes,
      billableHours: session.billableHours,
      billingAmount,
      taskType: session.taskType,
      description: session.description,
      isManualEntry: true,
    },
    message: 'Manual time entry created successfully',
  });
}

async function updateTimeSession(
  userId: string,
  data: any,
  timeTrackingRepo: TimeTrackingRepository
): Promise<APIGatewayProxyResult> {
  if (!data.sessionId) {
    return badRequest('Session ID is required');
  }
  
  const session = await timeTrackingRepo.findSessionById(data.sessionId);
  
  if (!session || session.masterId !== userId) {
    return forbidden('Session not found or access denied');
  }
  
  // Prepare update data
  const updateData: any = {};
  
  if (data.description !== undefined) updateData.description = data.description;
  if (data.taskType !== undefined) updateData.taskType = data.taskType;
  if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
  if (data.billableHours !== undefined) updateData.billableHours = data.billableHours;
  if (data.notes !== undefined) updateData.finalNotes = data.notes;
  if (data.attachments !== undefined) updateData.attachments = data.attachments;
  
  // Update session
  const updatedSession = await timeTrackingRepo.updateSession(data.sessionId, updateData);
  
  logger.info('Time tracking session updated', { 
    sessionId: data.sessionId,
    masterId: userId 
  });
  
  return success({
    session: updatedSession,
    message: 'Time tracking session updated successfully',
  });
}

async function deleteTimeSession(
  userId: string,
  data: any,
  timeTrackingRepo: TimeTrackingRepository
): Promise<APIGatewayProxyResult> {
  if (!data.sessionId) {
    return badRequest('Session ID is required');
  }
  
  const session = await timeTrackingRepo.findSessionById(data.sessionId);
  
  if (!session || session.masterId !== userId) {
    return forbidden('Session not found or access denied');
  }
  
  if (session.status === 'ACTIVE') {
    return badRequest('Cannot delete active session. Stop it first.');
  }
  
  // Delete session and related entries
  await timeTrackingRepo.deleteSession(data.sessionId);
  
  logger.info('Time tracking session deleted', { 
    sessionId: data.sessionId,
    masterId: userId 
  });
  
  return success({
    message: 'Time tracking session deleted successfully',
  });
}

// Helper functions
async function getClientIdFromSession(session: TimeTrackingSession): Promise<string | null> {
  try {
    if (session.projectId) {
      const project = await getItem({
        PK: `PROJECT#${session.projectId}`,
        SK: 'DETAILS',
      });
      return project?.clientId || null;
    }
    
    if (session.bookingId) {
      const booking = await getItem({
        PK: `BOOKING#${session.bookingId}`,
        SK: 'DETAILS',
      });
      return booking?.clientId || null;
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to get client ID from session', error, { sessionId: session.id });
    return null;
  }
}
function calculateElapsedTime(session: TimeTrackingSession): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const startTime = new Date(session.startTime);
  const elapsedMs = now.getTime() - startTime.getTime();
  
  // Subtract paused time if any
  // This would need to be calculated from time entries
  
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds };
}

function calculateTotalTime(session: any, endTime: Date): { hours: number; minutes: number; seconds: number } {
  const startTime = new Date(session.startTime);
  const totalMs = endTime.getTime() - startTime.getTime();
  
  // Subtract paused time from entries
  let pausedMs = 0;
  let lastPauseTime: Date | null = null;
  
  if (session.timeEntries && session.timeEntries.length > 0) {
    for (const entry of session.timeEntries) {
      if (entry.entryType === 'PAUSE') {
        lastPauseTime = new Date(entry.timestamp);
      } else if (entry.entryType === 'RESUME' && lastPauseTime) {
        pausedMs += new Date(entry.timestamp).getTime() - lastPauseTime.getTime();
        lastPauseTime = null;
      }
    }
  }
  
  // If session ended while paused, add final pause time
  if (lastPauseTime && session.status === 'PAUSED') {
    pausedMs += endTime.getTime() - lastPauseTime.getTime();
  }
  
  const activeMs = totalMs - pausedMs;
  const totalSeconds = Math.floor(activeMs / 1000);
  const hours = totalSeconds / 3600;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds };
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(manageTimeSessionsHandler)
  )
);