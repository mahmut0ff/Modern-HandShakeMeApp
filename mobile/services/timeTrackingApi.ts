import { api } from './api';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance for time tracking
const timeTrackingClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
timeTrackingClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface TimeTrackingLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface TimeTrackingAttachment {
  fileName: string;
  fileUrl: string;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  description?: string;
}

export interface AutoTrackingSettings {
  enabled: boolean;
  pauseOnIdle: boolean;
  idleThresholdMinutes: number;
  autoStopAfterHours: number;
  trackLocation: boolean;
  requirePhotos: boolean;
}

export type TaskType = 'PREPARATION' | 'TRAVEL' | 'WORK' | 'BREAK' | 'CLEANUP' | 'DOCUMENTATION' | 'OTHER';
export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface TimeTrackingSession {
  id: string;
  masterId: string;
  projectId?: string;
  bookingId?: string;
  status: SessionStatus;
  taskType: TaskType;
  startTime: string;
  endTime?: string;
  totalMinutes?: number;
  billableHours?: number;
  hourlyRate?: number;
  description?: string;
  finalNotes?: string;
  location?: TimeTrackingLocation;
  attachments?: TimeTrackingAttachment[];
  autoTrackingSettings?: AutoTrackingSettings;
  isManualEntry?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  sessionId: string;
  entryType: 'START' | 'PAUSE' | 'RESUME' | 'STOP';
  timestamp: string;
  location?: TimeTrackingLocation;
  notes?: string;
}

export interface TimeStatistics {
  totalSessions: number;
  totalHours: number;
  totalBillableHours: number;
  totalEarnings: number;
  averageSessionDuration: number;
  mostProductiveDay: string;
  mostCommonTaskType: string;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  hoursThisWeek: number;
  hoursThisMonth: number;
  earningsThisWeek: number;
  earningsThisMonth: number;
  taskTypeBreakdown: Array<{
    taskType: string;
    sessions: number;
    hours: number;
    percentage: number;
  }>;
  dailyStats: Array<{
    date: string;
    sessions: number;
    hours: number;
    earnings: number;
  }>;
  weeklyStats: Array<{
    week: string;
    sessions: number;
    hours: number;
    earnings: number;
  }>;
  monthlyStats: Array<{
    month: string;
    sessions: number;
    hours: number;
    earnings: number;
  }>;
}

export interface TimeTrackingTemplate {
  id: string;
  name: string;
  description: string;
  taskType: TaskType;
  defaultHourlyRate?: number;
  autoTrackingSettings?: AutoTrackingSettings;
  isDefault: boolean;
  createdAt: string;
}

// Start time tracking session
export const startTimeSession = async (data: {
  projectId?: string;
  bookingId?: string;
  taskType?: TaskType;
  description?: string;
  location?: TimeTrackingLocation;
  hourlyRate?: number;
  autoTracking?: AutoTrackingSettings;
}) => {
  const response = await timeTrackingClient.post('/time-tracking/sessions', {
    action: 'START_SESSION',
    ...data,
  });
  return response.data;
};

// Pause time tracking session
export const pauseTimeSession = async (sessionId?: string, location?: TimeTrackingLocation, notes?: string) => {
  const response = await timeTrackingClient.post('/time-tracking/sessions', {
    action: 'PAUSE_SESSION',
    sessionId,
    location,
    notes,
  });
  return response.data;
};

// Resume time tracking session
export const resumeTimeSession = async (sessionId: string, location?: TimeTrackingLocation, notes?: string) => {
  const response = await timeTrackingClient.post('/time-tracking/sessions', {
    action: 'RESUME_SESSION',
    sessionId,
    location,
    notes,
  });
  return response.data;
};

// Stop time tracking session
export const stopTimeSession = async (data: {
  sessionId?: string;
  endTime?: string;
  billableHours?: number;
  notes?: string;
  location?: TimeTrackingLocation;
  attachments?: TimeTrackingAttachment[];
}) => {
  const response = await timeTrackingClient.post('/time-tracking/sessions', {
    action: 'STOP_SESSION',
    ...data,
  });
  return response.data;
};

// Add manual time entry
export const addManualTimeEntry = async (data: {
  projectId?: string;
  bookingId?: string;
  startTime: string;
  endTime: string;
  taskType?: TaskType;
  description?: string;
  billableHours?: number;
  hourlyRate?: number;
  notes?: string;
  location?: TimeTrackingLocation;
  attachments?: TimeTrackingAttachment[];
}) => {
  const response = await timeTrackingClient.post('/time-tracking/sessions', {
    action: 'ADD_MANUAL_ENTRY',
    ...data,
  });
  return response.data;
};

// Update time tracking session
export const updateTimeSession = async (sessionId: string, data: {
  description?: string;
  taskType?: TaskType;
  hourlyRate?: number;
  billableHours?: number;
  notes?: string;
  attachments?: TimeTrackingAttachment[];
}) => {
  const response = await timeTrackingClient.post('/time-tracking/sessions', {
    action: 'UPDATE_SESSION',
    sessionId,
    ...data,
  });
  return response.data;
};

// Delete time tracking session
export const deleteTimeSession = async (sessionId: string) => {
  const response = await timeTrackingClient.post('/time-tracking/sessions', {
    action: 'DELETE_SESSION',
    sessionId,
  });
  return response.data;
};

// Get active session
export const getActiveSession = async (): Promise<{
  session: TimeTrackingSession | null;
  elapsedTime?: { hours: number; minutes: number; seconds: number };
}> => {
  const response = await timeTrackingClient.get('/time-tracking/active');
  return response.data;
};

// Get time tracking sessions
export const getTimeSessions = async (params?: {
  projectId?: string;
  bookingId?: string;
  startDate?: string;
  endDate?: string;
  status?: SessionStatus;
  taskType?: string;
  page?: number;
  limit?: number;
}): Promise<{
  sessions: TimeTrackingSession[];
  totalCount: number;
  totalHours: number;
  totalBillableHours: number;
  totalEarnings: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> => {
  const response = await timeTrackingClient.get('/time-tracking/sessions', { params });
  return response.data;
};

// Get session entries
export const getSessionEntries = async (sessionId: string): Promise<{
  session: TimeTrackingSession;
  entries: TimeEntry[];
  timeline: Array<{
    timestamp: string;
    type: string;
    description: string;
    duration?: number;
    location?: TimeTrackingLocation;
    notes?: string;
  }>;
}> => {
  const response = await timeTrackingClient.get(`/time-tracking/sessions/${sessionId}/entries`);
  return response.data;
};

// Get time tracking statistics
export const getTimeStatistics = async (params?: {
  period?: 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  projectId?: string;
  bookingId?: string;
}): Promise<TimeStatistics> => {
  const response = await timeTrackingClient.get('/time-tracking/statistics', { params });
  return response.data;
};

// Export time tracking data
export const exportTimeData = async (data: {
  format: 'CSV' | 'PDF' | 'EXCEL';
  startDate?: string;
  endDate?: string;
  projectId?: string;
  bookingId?: string;
  includeEntries?: boolean;
  includeAttachments?: boolean;
}): Promise<{
  exportUrl: string;
  fileName: string;
  format: string;
  message: string;
}> => {
  const response = await timeTrackingClient.post('/time-tracking/export', data);
  return response.data;
};

// Get time tracking templates
export const getTimeTemplates = async (): Promise<{
  templates: TimeTrackingTemplate[];
}> => {
  const response = await timeTrackingClient.get('/time-tracking/templates');
  return response.data;
};

// Create time tracking template
export const createTimeTemplate = async (data: {
  name: string;
  description: string;
  taskType: TaskType;
  defaultHourlyRate?: number;
  autoTrackingSettings?: AutoTrackingSettings;
  isDefault?: boolean;
}): Promise<{
  template: TimeTrackingTemplate;
  message: string;
}> => {
  const response = await timeTrackingClient.post('/time-tracking/templates', data);
  return response.data;
};

// Delete time tracking template
export const deleteTimeTemplate = async (templateId: string): Promise<{
  message: string;
}> => {
  const response = await timeTrackingClient.delete(`/time-tracking/templates/${templateId}`);
  return response.data;
};

export const timeTrackingApi = {
  startTimeSession,
  pauseTimeSession,
  resumeTimeSession,
  stopTimeSession,
  addManualTimeEntry,
  updateTimeSession,
  deleteTimeSession,
  getActiveSession,
  getTimeSessions,
  getSessionEntries,
  getTimeStatistics,
  exportTimeData,
  getTimeTemplates,
  createTimeTemplate,
  deleteTimeTemplate,
};
