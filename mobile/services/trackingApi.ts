import { api } from './api';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationTracking {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  masterId: string;
  masterName: string;
  bookingId?: string;
  projectId?: string;
  settings: {
    updateInterval: number;
    highAccuracyMode: boolean;
    shareWithClient: boolean;
    autoStopAfterCompletion: boolean;
    geofenceRadius: number;
  };
  startedAt: string;
  endedAt?: string;
  lastUpdateAt?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  stats?: {
    duration: number;
    totalDistance: number;
    averageSpeed: number;
    maxSpeed: number;
    pointsCount: number;
  };
}

export interface LocationUpdate {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface GeofenceStatus {
  withinGeofence: boolean;
  distance: number;
  radius: number;
}

export interface TrackingEvent {
  id: string;
  eventType: 'START' | 'ARRIVAL' | 'DEPARTURE' | 'PAUSE' | 'RESUME' | 'STOP';
  timestamp: string;
  description: string;
  location?: LocationData;
}

export interface StartTrackingRequest {
  action: 'START_TRACKING';
  bookingId?: string;
  projectId?: string;
  location?: LocationData;
  trackingSettings?: {
    updateInterval?: number;
    highAccuracyMode?: boolean;
    shareWithClient?: boolean;
    autoStopAfterCompletion?: boolean;
    geofenceRadius?: number;
  };
}

export interface UpdateLocationRequest {
  action: 'UPDATE_LOCATION';
  bookingId?: string;
  projectId?: string;
  location: LocationData;
}

export interface StopTrackingRequest {
  action: 'STOP_TRACKING';
  bookingId?: string;
  projectId?: string;
}

export interface GetLocationRequest {
  action: 'GET_LOCATION';
  bookingId?: string;
  projectId?: string;
}

export interface GetTrackingHistoryRequest {
  action: 'GET_TRACKING_HISTORY';
  bookingId?: string;
  projectId?: string;
  timeRange?: {
    startTime?: string;
    endTime?: string;
  };
}

export const trackingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Start location tracking
    startLocationTracking: builder.mutation<{
      tracking: LocationTracking;
      message: string;
      trackingUrl: string;
    }, StartTrackingRequest>({
      query: (data) => ({
        url: '/tracking/real-time-location',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tracking'],
    }),

    // Update current location
    updateLocation: builder.mutation<{
      locationUpdate: {
        id: string;
        timestamp: string;
        geofenceStatus?: GeofenceStatus;
      };
      message: string;
    }, UpdateLocationRequest>({
      query: (data) => ({
        url: '/tracking/real-time-location',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tracking'],
    }),

    // Stop location tracking
    stopLocationTracking: builder.mutation<{
      tracking: LocationTracking;
      message: string;
    }, StopTrackingRequest>({
      query: (data) => ({
        url: '/tracking/real-time-location',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tracking'],
    }),

    // Get current location
    getCurrentLocation: builder.mutation<{
      tracking: LocationTracking;
      location?: LocationUpdate;
      message: string;
    }, GetLocationRequest>({
      query: (data) => ({
        url: '/tracking/real-time-location',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tracking'],
    }),

    // Get tracking history
    getTrackingHistory: builder.mutation<{
      tracking: LocationTracking;
      locationHistory: LocationUpdate[];
      routeStats: LocationTracking['stats'];
      message: string;
    }, GetTrackingHistoryRequest>({
      query: (data) => ({
        url: '/tracking/real-time-location',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tracking'],
    }),

    // Get active tracking sessions
    getActiveTrackingSessions: builder.query<{
      sessions: LocationTracking[];
      totalCount: number;
    }, { masterId?: string; clientId?: string }>({
      query: (params) => ({
        url: '/tracking/active-sessions',
        params,
      }),
      providesTags: ['Tracking'],
    }),

    // Get tracking events
    getTrackingEvents: builder.query<{
      events: TrackingEvent[];
      totalCount: number;
    }, {
      trackingId: string;
      eventTypes?: string[];
      startTime?: string;
      endTime?: string;
    }>({
      query: (params) => ({
        url: '/tracking/events',
        params,
      }),
      providesTags: (result, error, { trackingId }) => [
        { type: 'Tracking', id: trackingId },
      ],
    }),

    // Get tracking statistics
    getTrackingStatistics: builder.query<{
      totalSessions: number;
      totalDistance: number;
      totalDuration: number;
      averageSessionDuration: number;
      sessionsThisWeek: number;
      sessionsThisMonth: number;
      topRoutes: Array<{
        route: string;
        count: number;
        averageDistance: number;
        averageDuration: number;
      }>;
      dailyStats: Array<{
        date: string;
        sessions: number;
        distance: number;
        duration: number;
      }>;
    }, {
      masterId?: string;
      period?: 'week' | 'month' | 'year';
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/tracking/statistics',
        params,
      }),
      providesTags: ['Tracking'],
    }),

    // Share tracking link
    shareTrackingLink: builder.mutation<{
      trackingUrl: string;
      shareCode: string;
      expiresAt: string;
      message: string;
    }, {
      trackingId: string;
      shareWith?: string[];
      expirationHours?: number;
      allowAnonymous?: boolean;
    }>({
      query: (data) => ({
        url: '/tracking/share-link',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tracking'],
    }),

    // Get shared tracking
    getSharedTracking: builder.query<{
      tracking: LocationTracking;
      location?: LocationUpdate;
      isLive: boolean;
      permissions: {
        canViewHistory: boolean;
        canViewRealTime: boolean;
        canViewStats: boolean;
      };
    }, {
      shareCode: string;
      trackingId: string;
    }>({
      query: (params) => ({
        url: '/tracking/shared',
        params,
      }),
      providesTags: (result, error, { trackingId }) => [
        { type: 'Tracking', id: `shared-${trackingId}` },
      ],
    }),
  }),
});

export const {
  useStartLocationTrackingMutation,
  useUpdateLocationMutation,
  useStopLocationTrackingMutation,
  useGetCurrentLocationMutation,
  useGetTrackingHistoryMutation,
  useGetActiveTrackingSessionsQuery,
  useGetTrackingEventsQuery,
  useGetTrackingStatisticsQuery,
  useShareTrackingLinkMutation,
  useGetSharedTrackingQuery,
} = trackingApi;