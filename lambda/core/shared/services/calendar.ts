// Calendar Service - Integration with external calendar providers

import { logger } from '../utils/logger';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

export interface CalendarCredentials {
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  calendarId?: string;
  serverUrl?: string;
  username?: string;
  password?: string;
}

export interface CalendarInfo {
  calendarId: string;
  calendarName: string;
  timeZone: string;
  description?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  recurrence?: any;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface SyncResult {
  stats: {
    eventsImported: number;
    eventsExported: number;
    eventsUpdated: number;
    eventsDeleted: number;
    conflictsFound: number;
  };
  conflicts: Array<{
    type: 'TIME_CONFLICT' | 'DUPLICATE_EVENT' | 'PERMISSION_DENIED';
    description: string;
    internalEvent?: any;
    externalEvent?: any;
    resolution?: string;
  }>;
}

export class CalendarService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.CALENDAR_ENCRYPTION_KEY || 'default-key';
  }

  async validateCredentials(provider: string, credentials: CalendarCredentials): Promise<CalendarInfo> {
    try {
      logger.info('Validating calendar credentials', { provider });

      switch (provider) {
        case 'GOOGLE':
          return await this.validateGoogleCredentials(credentials);
        case 'OUTLOOK':
          return await this.validateOutlookCredentials(credentials);
        case 'APPLE':
          return await this.validateAppleCredentials(credentials);
        case 'CALDAV':
          return await this.validateCalDAVCredentials(credentials);
        default:
          throw new Error(`Unsupported calendar provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Calendar credential validation failed', { provider, error: error.message });
      throw error;
    }
  }

  private async validateGoogleCredentials(credentials: CalendarCredentials): Promise<CalendarInfo> {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // Test API access by getting calendar list
      const response = await calendar.calendarList.list();
      
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('No calendars found');
      }

      // Use primary calendar or specified calendar
      const targetCalendar = credentials.calendarId 
        ? response.data.items.find(cal => cal.id === credentials.calendarId)
        : response.data.items.find(cal => cal.primary) || response.data.items[0];

      if (!targetCalendar) {
        throw new Error('Target calendar not found');
      }

      return {
        calendarId: targetCalendar.id!,
        calendarName: targetCalendar.summary || 'Primary Calendar',
        timeZone: targetCalendar.timeZone || 'UTC',
        description: targetCalendar.description,
      };
    } catch (error) {
      if (error.code === 401) {
        throw new Error('invalid_credentials');
      } else if (error.code === 403) {
        throw new Error('access_denied');
      }
      throw error;
    }
  }

  private async validateOutlookCredentials(credentials: CalendarCredentials): Promise<CalendarInfo> {
    const authProvider: AuthenticationProvider = {
      getAccessToken: async () => {
        return credentials.accessToken!;
      },
    };

    const graphClient = Client.initWithMiddleware({ authProvider });

    try {
      // Test API access
      const calendars = await graphClient.api('/me/calendars').get();
      
      if (!calendars.value || calendars.value.length === 0) {
        throw new Error('No calendars found');
      }

      // Use specified calendar or primary calendar
      const targetCalendar = credentials.calendarId
        ? calendars.value.find((cal: any) => cal.id === credentials.calendarId)
        : calendars.value.find((cal: any) => cal.isDefaultCalendar) || calendars.value[0];

      if (!targetCalendar) {
        throw new Error('Target calendar not found');
      }

      return {
        calendarId: targetCalendar.id,
        calendarName: targetCalendar.name,
        timeZone: targetCalendar.timeZone || 'UTC',
      };
    } catch (error) {
      if (error.code === 'InvalidAuthenticationToken') {
        throw new Error('invalid_credentials');
      } else if (error.code === 'Forbidden') {
        throw new Error('access_denied');
      }
      throw error;
    }
  }

  private async validateAppleCredentials(credentials: CalendarCredentials): Promise<CalendarInfo> {
    // Apple Calendar uses CalDAV protocol
    return await this.validateCalDAVCredentials(credentials);
  }

  private async validateCalDAVCredentials(credentials: CalendarCredentials): Promise<CalendarInfo> {
    if (!credentials.serverUrl || !credentials.username || !credentials.password) {
      throw new Error('CalDAV requires serverUrl, username, and password');
    }

    try {
      // Test CalDAV connection
      const response = await fetch(credentials.serverUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
          'Content-Type': 'application/xml',
          'Depth': '1',
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
          <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
            <D:prop>
              <D:displayname />
              <C:calendar-description />
              <C:calendar-timezone />
            </D:prop>
          </D:propfind>`,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('invalid_credentials');
        } else if (response.status === 403) {
          throw new Error('access_denied');
        }
        throw new Error(`CalDAV connection failed: ${response.status}`);
      }

      // Parse response to get calendar info
      const responseText = await response.text();
      
      return {
        calendarId: credentials.serverUrl,
        calendarName: 'CalDAV Calendar',
        timeZone: 'UTC', // Would parse from response in real implementation
      };
    } catch (error) {
      logger.error('CalDAV validation failed', { error: error.message });
      throw error;
    }
  }

  async performInitialSync(integration: any): Promise<SyncResult> {
    logger.info('Performing initial calendar sync', { 
      integrationId: integration.id,
      provider: integration.provider 
    });

    try {
      const events = await this.getCalendarEvents(integration, {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });

      const syncResult: SyncResult = {
        stats: {
          eventsImported: events.length,
          eventsExported: 0,
          eventsUpdated: 0,
          eventsDeleted: 0,
          conflictsFound: 0,
        },
        conflicts: [],
      };

      // Process imported events
      for (const event of events) {
        await this.processImportedEvent(integration.userId, event, syncResult);
      }

      // Export existing bookings to calendar if bidirectional sync
      if (integration.settings.syncDirection === 'BIDIRECTIONAL' || 
          integration.settings.syncDirection === 'TO_EXTERNAL') {
        const exportResult = await this.exportBookingsToCalendar(integration);
        syncResult.stats.eventsExported = exportResult.eventsExported;
      }

      logger.info('Initial sync completed', { 
        integrationId: integration.id,
        stats: syncResult.stats 
      });

      return syncResult;
    } catch (error) {
      logger.error('Initial sync failed', { 
        integrationId: integration.id,
        error: error.message 
      });
      throw error;
    }
  }

  async performSync(integration: any): Promise<SyncResult> {
    logger.info('Performing calendar sync', { 
      integrationId: integration.id,
      provider: integration.provider 
    });

    const syncResult: SyncResult = {
      stats: {
        eventsImported: 0,
        eventsExported: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        conflictsFound: 0,
      },
      conflicts: [],
    };

    try {
      // Get events since last sync
      const lastSyncDate = integration.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const events = await this.getCalendarEvents(integration, {
        startDate: lastSyncDate,
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        modifiedSince: lastSyncDate,
      });

      // Process events based on sync direction
      if (integration.settings.syncDirection === 'BIDIRECTIONAL' || 
          integration.settings.syncDirection === 'FROM_EXTERNAL') {
        for (const event of events) {
          await this.processImportedEvent(integration.userId, event, syncResult);
        }
      }

      if (integration.settings.syncDirection === 'BIDIRECTIONAL' || 
          integration.settings.syncDirection === 'TO_EXTERNAL') {
        const exportResult = await this.exportRecentBookingsToCalendar(integration, lastSyncDate);
        syncResult.stats.eventsExported += exportResult.eventsExported;
        syncResult.stats.eventsUpdated += exportResult.eventsUpdated;
      }

      return syncResult;
    } catch (error) {
      logger.error('Calendar sync failed', { 
        integrationId: integration.id,
        error: error.message 
      });
      throw error;
    }
  }

  private async getCalendarEvents(integration: any, options: {
    startDate: Date;
    endDate: Date;
    modifiedSince?: Date;
  }): Promise<CalendarEvent[]> {
    const credentials = await this.decryptCredentials(integration.credentials);

    switch (integration.provider) {
      case 'GOOGLE':
        return await this.getGoogleCalendarEvents(credentials, integration.calendarId, options);
      case 'OUTLOOK':
        return await this.getOutlookCalendarEvents(credentials, integration.calendarId, options);
      case 'APPLE':
      case 'CALDAV':
        return await this.getCalDAVEvents(credentials, options);
      default:
        throw new Error(`Unsupported provider: ${integration.provider}`);
    }
  }

  private async getGoogleCalendarEvents(
    credentials: CalendarCredentials,
    calendarId: string,
    options: any
  ): Promise<CalendarEvent[]> {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId,
      timeMin: options.startDate.toISOString(),
      timeMax: options.endDate.toISOString(),
      updatedMin: options.modifiedSince?.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (response.data.items || []).map(event => ({
      id: event.id!,
      title: event.summary || 'Untitled Event',
      description: event.description,
      startDateTime: new Date(event.start?.dateTime || event.start?.date!),
      endDateTime: new Date(event.end?.dateTime || event.end?.date!),
      location: event.location,
      attendees: event.attendees?.map(a => a.email!).filter(Boolean),
      isAllDay: !!event.start?.date,
      recurrence: event.recurrence,
      status: event.status as any || 'confirmed',
    }));
  }

  private async getOutlookCalendarEvents(
    credentials: CalendarCredentials,
    calendarId: string,
    options: any
  ): Promise<CalendarEvent[]> {
    const authProvider: AuthenticationProvider = {
      getAccessToken: async () => credentials.accessToken!,
    };

    const graphClient = Client.initWithMiddleware({ authProvider });

    let query = `/me/calendars/${calendarId}/events`;
    const params = new URLSearchParams({
      startDateTime: options.startDate.toISOString(),
      endDateTime: options.endDate.toISOString(),
    });

    if (options.modifiedSince) {
      params.append('$filter', `lastModifiedDateTime ge ${options.modifiedSince.toISOString()}`);
    }

    const response = await graphClient.api(`${query}?${params.toString()}`).get();

    return (response.value || []).map((event: any) => ({
      id: event.id,
      title: event.subject,
      description: event.body?.content,
      startDateTime: new Date(event.start.dateTime),
      endDateTime: new Date(event.end.dateTime),
      location: event.location?.displayName,
      attendees: event.attendees?.map((a: any) => a.emailAddress.address),
      isAllDay: event.isAllDay,
      recurrence: event.recurrence,
      status: event.showAs === 'free' ? 'tentative' : 'confirmed',
    }));
  }

  private async getCalDAVEvents(
    credentials: CalendarCredentials,
    options: any
  ): Promise<CalendarEvent[]> {
    // CalDAV implementation would go here
    // This is a simplified placeholder
    return [];
  }

  private async processImportedEvent(userId: string, event: CalendarEvent, syncResult: SyncResult) {
    // Check if this event should block availability
    if (this.shouldBlockAvailability(event)) {
      // Create blocked time slot
      // Implementation would create blocked time slot in database
      syncResult.stats.eventsImported++;
    }
  }

  private shouldBlockAvailability(event: CalendarEvent): boolean {
    // Logic to determine if an event should block availability
    // Could be based on event title, attendees, etc.
    return event.status === 'confirmed' && !event.title.includes('[HandShakeMe]');
  }

  async syncAvailabilityToCalendar(userId: string, availabilityRecords: any[]): Promise<void> {
    // Implementation to sync availability to external calendar
    logger.info('Syncing availability to calendar', { userId, recordCount: availabilityRecords.length });
  }

  async syncSpecificDatesToCalendar(userId: string, specificDates: any[]): Promise<void> {
    // Implementation to sync specific date availability
    logger.info('Syncing specific dates to calendar', { userId, dateCount: specificDates.length });
  }

  async syncBlockedSlotsToCalendar(userId: string, blockedSlots: any[]): Promise<void> {
    // Implementation to sync blocked slots to calendar
    logger.info('Syncing blocked slots to calendar', { userId, slotCount: blockedSlots.length });
  }

  async createVacationEvent(userId: string, vacation: any): Promise<void> {
    // Implementation to create vacation event in calendar
    logger.info('Creating vacation event in calendar', { userId, vacationId: vacation.id });
  }

  async importAvailabilityFromCalendar(integration: any): Promise<any> {
    // Implementation to import availability from calendar
    return {
      eventsImported: 0,
      conflicts: [],
    };
  }

  private async exportBookingsToCalendar(integration: any): Promise<{ eventsExported: number }> {
    // Implementation to export bookings to calendar
    return { eventsExported: 0 };
  }

  private async exportRecentBookingsToCalendar(integration: any, since: Date): Promise<{ 
    eventsExported: number; 
    eventsUpdated: number; 
  }> {
    // Implementation to export recent bookings
    return { eventsExported: 0, eventsUpdated: 0 };
  }

  async revokeAccess(integration: any): Promise<void> {
    const credentials = await this.decryptCredentials(integration.credentials);

    switch (integration.provider) {
      case 'GOOGLE':
        await this.revokeGoogleAccess(credentials);
        break;
      case 'OUTLOOK':
        await this.revokeOutlookAccess(credentials);
        break;
      // Other providers...
    }
  }

  private async revokeGoogleAccess(credentials: CalendarCredentials): Promise<void> {
    if (credentials.accessToken) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${credentials.accessToken}`, {
        method: 'POST',
      });
    }
  }

  private async revokeOutlookAccess(credentials: CalendarCredentials): Promise<void> {
    // Outlook token revocation would go here
  }

  async encryptToken(token: string): Promise<string> {
    // Simple encryption - in production, use proper encryption
    return Buffer.from(token).toString('base64');
  }

  private async decryptCredentials(encryptedCredentials: any): Promise<CalendarCredentials> {
    // Simple decryption - in production, use proper decryption
    const credentials = { ...encryptedCredentials };
    
    if (credentials.accessToken) {
      credentials.accessToken = Buffer.from(credentials.accessToken, 'base64').toString();
    }
    
    if (credentials.refreshToken) {
      credentials.refreshToken = Buffer.from(credentials.refreshToken, 'base64').toString();
    }
    
    return credentials;
  }
}