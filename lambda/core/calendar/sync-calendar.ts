// Sync with external calendar services (Google Calendar, Outlook, Apple Calendar)

import type { APIGatewayProxyResult } from 'aws-lambda';
import { CalendarRepository } from '../shared/repositories/calendar.repository';
import { success, badRequest, notFound, conflict } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { validate, syncCalendarSchema } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';
import { CalendarService } from '../shared/services/calendar.service';
import { NotificationService } from '../shared/services/notification';
import { CalendarIntegration } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

async function syncCalendarHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  if (userRole !== 'MASTER') {
    return badRequest('Only masters can sync calendars');
  }
  
  logger.info('Calendar sync request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(syncCalendarSchema, body);
  
  const calendarRepo = new CalendarRepository();
  const calendarService = new CalendarService();
  const notificationService = new NotificationService();
  
  try {
    switch (data.action) {
      case 'CONNECT':
        return await connectCalendar(userId, data, calendarRepo, calendarService, notificationService);
      case 'SYNC':
        return await syncCalendar(userId, data, calendarRepo, calendarService, notificationService);
      case 'DISCONNECT':
        return await disconnectCalendar(userId, data, calendarRepo, calendarService, notificationService);
      case 'UPDATE_SETTINGS':
        return await updateCalendarSettings(userId, data, calendarRepo, notificationService);
      default:
        return badRequest('Invalid action');
    }
  } catch (error) {
    logger.error('Calendar sync failed', { userId, action: data.action, error });
    throw error;
  }
}

async function connectCalendar(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  calendarService: CalendarService,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.credentials) {
    return badRequest('Credentials required for calendar connection');
  }
  
  // Check if calendar is already connected
  const existingConnection = await calendarRepo.getCalendarIntegration(userId, data.provider);
  
  if (existingConnection && existingConnection.isActive) {
    return conflict('Calendar is already connected');
  }
  
  try {
    // Validate credentials and get calendar info
    const calendarInfo = await calendarService.validateCredentials(data.provider, data.credentials);
    
    // Create calendar integration record
    const integration = await calendarRepo.createCalendarIntegration(userId, {
      provider: data.provider,
      calendarId: calendarInfo.calendarId,
      calendarName: calendarInfo.calendarName,
      credentials: {
        ...data.credentials,
        // Encrypt sensitive data
        accessToken: await calendarService.encryptToken(data.credentials.accessToken || ''),
        refreshToken: data.credentials.refreshToken ? 
          await calendarService.encryptToken(data.credentials.refreshToken) : undefined,
      },
      settings: data.settings || {
        syncDirection: 'BIDIRECTIONAL',
        syncFrequency: 'REAL_TIME',
        syncBookings: true,
        syncAvailability: true,
        syncPersonalEvents: false,
        conflictResolution: 'MANUAL',
        timeZone: 'UTC',
        eventPrefix: '[HandShakeMe]',
        includeClientInfo: false,
        includeLocation: true,
        reminderMinutes: [15, 60]
      },
      isActive: true
    });
    
    // Perform initial sync
    const syncResult = await calendarService.performInitialSync(integration);
    
    // Update integration with sync results
    await calendarRepo.updateCalendarIntegration(userId, data.provider, {
      lastSyncAt: new Date().toISOString(),
      syncStats: syncResult.stats
    });
    
    // Send notification
    await notificationService.sendCalendarNotification(
      userId,
      'CALENDAR_CONNECTED',
      {
        provider: data.provider,
        calendarName: calendarInfo.calendarName,
        syncedEvents: syncResult.stats.eventsImported,
      }
    );
    
    logger.info('Calendar connected successfully', { 
      userId, 
      provider: data.provider,
      integrationId: integration.id 
    });
    
    return success({
      integration: {
        id: integration.id,
        provider: integration.provider,
        calendarName: integration.calendarName,
        isActive: integration.isActive,
        settings: integration.settings,
        lastSyncAt: integration.lastSyncAt,
      },
      syncResult: syncResult.stats,
      message: 'Calendar connected and synced successfully',
    });
    
  } catch (error) {
    logger.error('Failed to connect calendar', { userId, provider: data.provider, error });
    
    if (error.message.includes('invalid_credentials')) {
      return badRequest('Invalid calendar credentials');
    } else if (error.message.includes('access_denied')) {
      return badRequest('Calendar access denied');
    } else {
      return badRequest('Failed to connect calendar. Please try again.');
    }
  }
}

async function syncCalendar(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  calendarService: CalendarService,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  // Get active calendar integration
  const integration = await calendarRepo.getCalendarIntegration(userId, data.provider);
  
  if (!integration || !integration.isActive) {
    return notFound('Calendar integration not found or inactive');
  }
  
  try {
    // Perform sync
    const syncResult = await calendarService.performSync(integration);
    
    // Update integration
    await calendarRepo.updateCalendarIntegration(userId, data.provider, {
      lastSyncAt: new Date().toISOString(),
      syncStats: syncResult.stats,
      lastError: undefined
    });
    
    // Create sync log
    await calendarRepo.createSyncLog({
      integrationId: integration.id,
      syncType: 'MANUAL',
      status: 'SUCCESS',
      stats: syncResult.stats,
      conflicts: syncResult.conflicts
    });
    
    // Handle conflicts if any
    if (syncResult.conflicts.length > 0) {
      await notificationService.sendCalendarNotification(
        userId,
        'SYNC_CONFLICTS',
        {
          provider: data.provider,
          conflictCount: syncResult.conflicts.length,
          conflicts: syncResult.conflicts,
        }
      );
    }
    
    logger.info('Calendar synced successfully', { 
      userId, 
      provider: data.provider,
      stats: syncResult.stats 
    });
    
    return success({
      syncResult: syncResult.stats,
      conflicts: syncResult.conflicts,
      message: 'Calendar synced successfully',
      nextSyncAt: getNextSyncTime(integration.settings.syncFrequency),
    });
    
  } catch (error) {
    logger.error('Calendar sync failed', { userId, provider: data.provider, error });
    
    // Update integration with error
    await calendarRepo.updateCalendarIntegration(userId, data.provider, {
      lastError: error.message,
      lastSyncAt: new Date().toISOString()
    });
    
    // Create error log
    await calendarRepo.createSyncLog({
      integrationId: integration.id,
      syncType: 'MANUAL',
      status: 'FAILED',
      error: error.message
    });
    
    return badRequest(`Calendar sync failed: ${error.message}`);
  }
}

async function disconnectCalendar(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  calendarService: CalendarService,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  const integration = await calendarRepo.getCalendarIntegration(userId, data.provider);
  
  if (!integration || !integration.isActive) {
    return notFound('Calendar integration not found or already disconnected');
  }
  
  try {
    // Revoke calendar access
    await calendarService.revokeAccess(integration);
    
    // Deactivate integration
    await calendarRepo.updateCalendarIntegration(userId, data.provider, {
      isActive: false,
      disconnectedAt: new Date().toISOString()
    });
    
    // Send notification
    await notificationService.sendCalendarNotification(
      userId,
      'CALENDAR_DISCONNECTED',
      {
        provider: data.provider,
        calendarName: integration.calendarName,
      }
    );
    
    logger.info('Calendar disconnected successfully', { 
      userId, 
      provider: data.provider 
    });
    
    return success({
      message: 'Calendar disconnected successfully',
    });
    
  } catch (error) {
    logger.error('Failed to disconnect calendar', { userId, provider: data.provider, error });
    return badRequest('Failed to disconnect calendar');
  }
}

async function updateCalendarSettings(
  userId: string,
  data: any,
  calendarRepo: CalendarRepository,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (!data.settings) {
    return badRequest('Settings required for update');
  }
  
  const integration = await calendarRepo.getCalendarIntegration(userId, data.provider);
  
  if (!integration || !integration.isActive) {
    return notFound('Calendar integration not found or inactive');
  }
  
  // Update settings
  const updatedIntegration = await calendarRepo.updateCalendarIntegration(userId, data.provider, {
    settings: {
      ...integration.settings,
      ...data.settings,
    },
    updatedAt: new Date().toISOString()
  });
  
  logger.info('Calendar settings updated', { 
    userId, 
    provider: data.provider,
    settings: data.settings 
  });
  
  return success({
    integration: {
      id: updatedIntegration.id,
      provider: updatedIntegration.provider,
      settings: updatedIntegration.settings,
    },
    message: 'Calendar settings updated successfully',
  });
}

function getNextSyncTime(frequency: string): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'REAL_TIME':
      return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    case 'HOURLY':
      return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    case 'DAILY':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    default:
      return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(syncCalendarHandler)
  )
);