import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance for location tracking
const locationTrackingClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
locationTrackingClient.interceptors.request.use(
  async (config: any) => {
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
  (error: any) => {
    return Promise.reject(error);
  }
);

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface TrackingSettings {
  updateInterval: number; // seconds
  highAccuracyMode: boolean;
  shareWithClient: boolean;
  autoStopAfterCompletion: boolean;
  geofenceRadius: number; // meters
}

export interface LocationTracking {
  id: string;
  masterId: string;
  bookingId?: string;
  projectId?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  settings: TrackingSettings;
  startedAt: string;
  endedAt?: string;
  lastUpdateAt?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  stats?: TrackingStats;
}

export interface TrackingStats {
  duration: number; // seconds
  totalDistance: number; // meters
  averageSpeed: number; // m/s
  maxSpeed: number; // m/s
  pointsCount: number;
}

export interface LocationUpdate {
  id: string;
  trackingId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface TrackingEvent {
  id: string;
  trackingId: string;
  eventType: 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'ARRIVAL' | 'DEPARTURE' | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT';
  timestamp: string;
  description?: string;
  location?: LocationCoordinates;
}

// Start location tracking
export const startLocationTracking = async (data: {
  bookingId?: string;
  projectId?: string;
  location?: LocationCoordinates;
  trackingSettings?: Partial<TrackingSettings>;
}): Promise<{
  tracking: LocationTracking;
  message: string;
  trackingUrl: string;
}> => {
  const response = await locationTrackingClient.post('/tracking/location', {
    action: 'START_TRACKING',
    ...data,
  });
  return response.data;
};

// Update location
export const updateLocation = async (data: {
  bookingId?: string;
  projectId?: string;
  location: LocationCoordinates;
}): Promise<{
  locationUpdate: {
    id: string;
    timestamp: string;
    geofenceStatus: any;
  };
  message: string;
}> => {
  const response = await locationTrackingClient.post('/tracking/location', {
    action: 'UPDATE_LOCATION',
    ...data,
  });
  return response.data;
};

// Stop location tracking
export const stopLocationTracking = async (data: {
  bookingId?: string;
  projectId?: string;
}): Promise<{
  tracking: LocationTracking;
  message: string;
}> => {
  const response = await locationTrackingClient.post('/tracking/location', {
    action: 'STOP_TRACKING',
    ...data,
  });
  return response.data;
};

// Get current location
export const getCurrentLocation = async (data: {
  bookingId?: string;
  projectId?: string;
}): Promise<{
  tracking: LocationTracking;
  location: LocationCoordinates | null;
  message: string;
}> => {
  const response = await locationTrackingClient.post('/tracking/location', {
    action: 'GET_LOCATION',
    ...data,
  });
  return response.data;
};

// Get tracking history
export const getTrackingHistory = async (data: {
  bookingId?: string;
  projectId?: string;
  trackingId?: string;
  timeRange?: {
    startTime?: string;
    endTime?: string;
  };
}): Promise<{
  tracking: LocationTracking;
  locationHistory: LocationCoordinates[];
  routeStats: TrackingStats;
  message: string;
}> => {
  const response = await locationTrackingClient.post('/tracking/location', {
    action: 'GET_TRACKING_HISTORY',
    ...data,
  });
  return response.data;
};

// Get tracking events
export const getTrackingEvents = async (params: {
  trackingId: string;
  eventTypes?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}): Promise<{
  events: TrackingEvent[];
  totalCount: number;
}> => {
  const response = await locationTrackingClient.get('/tracking/events', { params });
  return response.data;
};

// Get tracking statistics
export const getTrackingStatistics = async (params?: {
  masterId?: string;
  period?: 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalSessions: number;
  totalDistance: number;
  totalDuration: number;
  averageSessionDuration: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  topRoutes: any[];
  dailyStats: any[];
}> => {
  const response = await locationTrackingClient.get('/tracking/statistics', { params });
  return response.data;
};

// Share tracking link
export const shareTrackingLink = async (data: {
  trackingId: string;
  shareWith?: string[];
  expirationHours?: number;
  allowAnonymous?: boolean;
}): Promise<{
  trackingUrl: string;
  shareCode: string;
  expiresAt: string;
  message: string;
}> => {
  const response = await locationTrackingClient.post('/tracking/share', data);
  return response.data;
};

// Get shared tracking
export const getSharedTracking = async (params: {
  shareCode: string;
  trackingId: string;
}): Promise<{
  tracking: LocationTracking;
  location: LocationCoordinates | null;
  isLive: boolean;
  permissions: {
    canViewHistory: boolean;
    canViewRealTime: boolean;
    canViewStats: boolean;
  };
}> => {
  const response = await locationTrackingClient.get('/tracking/shared', { params });
  return response.data;
};

// Get active sessions
export const getActiveSessions = async (params?: {
  masterId?: string;
  clientId?: string;
}): Promise<{
  sessions: LocationTracking[];
  totalCount: number;
}> => {
  const response = await locationTrackingClient.get('/tracking/active-sessions', { params });
  return response.data;
};

export const locationTrackingApi = {
  startLocationTracking,
  updateLocation,
  stopLocationTracking,
  getCurrentLocation,
  getTrackingHistory,
  getTrackingEvents,
  getTrackingStatistics,
  shareTrackingLink,
  getSharedTracking,
  getActiveSessions,
};
