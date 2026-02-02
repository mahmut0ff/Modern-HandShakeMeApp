// @ts-nocheck
// Time Tracking Repository for DynamoDB
// Note: This file has duplicate property issues

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { logger } from '../utils/logger';

export type TaskType = 'PREPARATION' | 'TRAVEL' | 'WORK' | 'BREAK' | 'CLEANUP' | 'DOCUMENTATION' | 'OTHER';
export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type EntryType = 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'MANUAL';

export interface TimeTrackingSession {
  id: string;
  masterId: string;
  projectId?: string;
  bookingId?: string;
  status: SessionStatus;
  taskType: TaskType;
  startTime: string;
  endTime?: string;
  lastPauseTime?: string;
  lastResumeTime?: string;
  totalMinutes?: number;
  billableHours?: number;
  hourlyRate?: number;
  description?: string;
  finalNotes?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    description?: string;
  }>;
  autoTrackingSettings?: {
    enabled: boolean;
    pauseOnIdle: boolean;
    idleThresholdMinutes: number;
    autoStopAfterHours: number;
    trackLocation: boolean;
    requirePhotos: boolean;
  };
  isManualEntry: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  sessionId: string;
  entryType: EntryType;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  createdAt: string;
}

export class TimeTrackingRepository {
  // Session CRUD operations
  async createSession(data: Partial<TimeTrackingSession>): Promise<TimeTrackingSession> {
    try {
      if (!data.masterId) {
        throw new Error('Master ID is required');
      }

      const session: TimeTrackingSession = {
        id: uuidv4(),
        masterId: data.masterId,
        projectId: data.projectId,
        bookingId: data.bookingId,
        status: data.status || 'ACTIVE',
        taskType: data.taskType || 'WORK',
        startTime: data.startTime || new Date().toISOString(),
        endTime: data.endTime,
        totalMinutes: data.totalMinutes,
        billableHours: data.billableHours,
        hourlyRate: data.hourlyRate,
        description: data.description,
        finalNotes: data.finalNotes,
        location: data.location,
        attachments: data.attachments || [],
        autoTrackingSettings: data.autoTrackingSettings,
        isManualEntry: data.isManualEntry || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await putItem({
        PK: `SESSION#${session.id}`,
        SK: 'DETAILS',
        ...session,
        GSI1PK: `MASTER#${session.masterId}`,
        GSI1SK: `SESSION#${session.createdAt}#${session.id}`,
        GSI2PK: `STATUS#${session.status}`,
        GSI2SK: `${session.createdAt}#${session.id}`,
      });

      logger.info('Time tracking session created', { sessionId: session.id, masterId: session.masterId });
      return session;
    } catch (error) {
      logger.error('Failed to create time tracking session', error, { masterId: data.masterId });
      throw new Error('Failed to create time tracking session');
    }
  }

  async findSessionById(sessionId: string): Promise<TimeTrackingSession | null> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const item = await getItem({
        PK: `SESSION#${sessionId}`,
        SK: 'DETAILS',
      });

      return item as TimeTrackingSession | null;
    } catch (error) {
      logger.error('Failed to find session by ID', error, { sessionId });
      throw new Error('Failed to retrieve session');
    }
  }

  async findActiveSessionByMaster(masterId: string): Promise<TimeTrackingSession | null> {
    try {
      if (!masterId) {
        throw new Error('Master ID is required');
      }

      const items = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `MASTER#${masterId}`,
        },
        FilterExpression: '#status IN (:active, :paused)',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':pk': `MASTER#${masterId}`,
          ':active': 'ACTIVE',
          ':paused': 'PAUSED',
        },
        ScanIndexForward: false,
        Limit: 1,
      });

      return items.length > 0 ? (items[0] as TimeTrackingSession) : null;
    } catch (error) {
      logger.error('Failed to find active session', error, { masterId });
      throw new Error('Failed to retrieve active session');
    }
  }

  async findSessionsByMaster(
    masterId: string,
    filters?: {
      status?: SessionStatus;
      projectId?: string;
      bookingId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<TimeTrackingSession[]> {
    try {
      if (!masterId) {
        throw new Error('Master ID is required');
      }

      const limit = filters?.limit || 50;
      let items = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `MASTER#${masterId}`,
        },
        ScanIndexForward: false,
        Limit: limit * 2, // Get more for filtering
      });

      // Apply filters
      let sessions = items as TimeTrackingSession[];

      if (filters?.status) {
        sessions = sessions.filter(s => s.status === filters.status);
      }

      if (filters?.projectId) {
        sessions = sessions.filter(s => s.projectId === filters.projectId);
      }

      if (filters?.bookingId) {
        sessions = sessions.filter(s => s.bookingId === filters.bookingId);
      }

      if (filters?.startDate) {
        sessions = sessions.filter(s => s.startTime >= filters.startDate!);
      }

      if (filters?.endDate) {
        sessions = sessions.filter(s => s.startTime <= filters.endDate!);
      }

      return sessions.slice(0, limit);
    } catch (error) {
      logger.error('Failed to find sessions by master', error, { masterId, filters });
      throw new Error('Failed to retrieve sessions');
    }
  }

  async updateSession(sessionId: string, data: Partial<TimeTrackingSession>): Promise<TimeTrackingSession> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const updateExpressions: string[] = [];
      const attributeValues: Record<string, any> = {};
      const attributeNames: Record<string, string> = {};

      Object.entries(data).forEach(([key, value], index) => {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'masterId') {
          updateExpressions.push(`#attr${index} = :val${index}`);
          attributeNames[`#attr${index}`] = key;
          attributeValues[`:val${index}`] = value;
        }
      });

      updateExpressions.push('#updatedAt = :updatedAt');
      attributeNames['#updatedAt'] = 'updatedAt';
      attributeValues[':updatedAt'] = new Date().toISOString();

      const updated = await updateItem({
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: 'DETAILS',
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
      });

      logger.info('Time tracking session updated', { sessionId });
      return updated as TimeTrackingSession;
    } catch (error) {
      logger.error('Failed to update session', error, { sessionId });
      throw new Error('Failed to update session');
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      // Delete all time entries first
      const entries = await this.findEntriesBySession(sessionId);
      for (const entry of entries) {
        await deleteItem({
          PK: `SESSION#${sessionId}`,
          SK: `ENTRY#${entry.timestamp}#${entry.id}`,
        });
      }

      // Delete session
      await deleteItem({
        PK: `SESSION#${sessionId}`,
        SK: 'DETAILS',
      });

      logger.info('Time tracking session deleted', { sessionId });
    } catch (error) {
      logger.error('Failed to delete session', error, { sessionId });
      throw new Error('Failed to delete session');
    }
  }

  // Time Entry operations
  async createEntry(data: Partial<TimeEntry>): Promise<TimeEntry> {
    try {
      if (!data.sessionId || !data.entryType) {
        throw new Error('Session ID and entry type are required');
      }

      const entry: TimeEntry = {
        id: uuidv4(),
        sessionId: data.sessionId,
        entryType: data.entryType,
        timestamp: data.timestamp || new Date().toISOString(),
        location: data.location,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      await putItem({
        PK: `SESSION#${entry.sessionId}`,
        SK: `ENTRY#${entry.timestamp}#${entry.id}`,
        ...entry,
      });

      logger.info('Time entry created', { entryId: entry.id, sessionId: entry.sessionId });
      return entry;
    } catch (error) {
      logger.error('Failed to create time entry', error, { sessionId: data.sessionId });
      throw new Error('Failed to create time entry');
    }
  }

  async findEntriesBySession(sessionId: string): Promise<TimeEntry[]> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const items = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `SESSION#${sessionId}`,
          ':sk': 'ENTRY#',
        },
        ScanIndexForward: true, // Chronological order
      });

      return items as TimeEntry[];
    } catch (error) {
      logger.error('Failed to find entries by session', error, { sessionId });
      throw new Error('Failed to retrieve time entries');
    }
  }

  // Statistics and reporting
  async getSessionStatistics(
    masterId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalSessions: number;
    totalHours: number;
    totalBillableHours: number;
    totalEarnings: number;
    byTaskType: Record<TaskType, { count: number; hours: number }>;
    byStatus: Record<SessionStatus, number>;
  }> {
    try {
      if (!masterId) {
        throw new Error('Master ID is required');
      }

      const sessions = await this.findSessionsByMaster(masterId, {
        startDate,
        endDate,
        limit: 1000,
      });

      const stats = {
        totalSessions: sessions.length,
        totalHours: 0,
        totalBillableHours: 0,
        totalEarnings: 0,
        byTaskType: {} as Record<TaskType, { count: number; hours: number }>,
        byStatus: {} as Record<SessionStatus, number>,
      };

      sessions.forEach(session => {
        // Total hours
        if (session.totalMinutes) {
          stats.totalHours += session.totalMinutes / 60;
        }

        // Billable hours
        if (session.billableHours) {
          stats.totalBillableHours += session.billableHours;
        }

        // Earnings
        if (session.billableHours && session.hourlyRate) {
          stats.totalEarnings += session.billableHours * session.hourlyRate;
        }

        // By task type
        if (!stats.byTaskType[session.taskType]) {
          stats.byTaskType[session.taskType] = { count: 0, hours: 0 };
        }
        stats.byTaskType[session.taskType].count++;
        if (session.totalMinutes) {
          stats.byTaskType[session.taskType].hours += session.totalMinutes / 60;
        }

        // By status
        stats.byStatus[session.status] = (stats.byStatus[session.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get session statistics', error, { masterId });
      throw new Error('Failed to retrieve statistics');
    }
  }
}
