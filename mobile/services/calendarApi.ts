import { api } from './api';

export interface CalendarIntegration {
  id: string;
  provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
  calendarId: string;
  calendarName: string;
  isActive: boolean;
  settings: {
    syncDirection: 'BIDIRECTIONAL' | 'TO_EXTERNAL' | 'FROM_EXTERNAL';
    syncFrequency: 'REAL_TIME' | 'HOURLY' | 'DAILY';
    syncBookings: boolean;
    syncAvailability: boolean;
    syncPersonalEvents: boolean;
    conflictResolution: 'MANUAL' | 'EXTERNAL_WINS' | 'INTERNAL_WINS';
    timeZone: string;
    calendarName?: string;
    eventPrefix: string;
    includeClientInfo: boolean;
    includeLocation: boolean;
    reminderMinutes: number[];
  };
  lastSyncAt?: string;
  syncStats?: {
    eventsImported: number;
    eventsExported: number;
    eventsUpdated: number;
    eventsDeleted: number;
    conflictsFound: number;
  };
  lastError?: string;
  createdAt: string;
}

export interface CalendarSyncResult {
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
  nextSyncAt?: string;
}

export interface MasterAvailability {
  id: string;
  scheduleType: 'WEEKLY' | 'SPECIFIC_DATE';
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  serviceTypes?: string[];
  maxBookings: number;
  bufferBefore: number;
  bufferAfter: number;
  specialPricing?: {
    multiplier?: number;
    fixedAmount?: number;
  };
  reason?: string;
  timeZone: string;
}

export interface BlockedTimeSlot {
  id: string;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  blockType: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'MAINTENANCE' | 'OTHER';
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
    endDate?: string;
    occurrences?: number;
  };
  timeZone: string;
}

export interface ConnectCalendarRequest {
  provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
  action: 'CONNECT';
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    calendarId?: string;
    serverUrl?: string;
    username?: string;
    password?: string;
  };
  settings?: {
    syncDirection?: 'BIDIRECTIONAL' | 'TO_EXTERNAL' | 'FROM_EXTERNAL';
    syncFrequency?: 'REAL_TIME' | 'HOURLY' | 'DAILY';
    syncBookings?: boolean;
    syncAvailability?: boolean;
    syncPersonalEvents?: boolean;
    conflictResolution?: 'MANUAL' | 'EXTERNAL_WINS' | 'INTERNAL_WINS';
    timeZone?: string;
    calendarName?: string;
    eventPrefix?: string;
    includeClientInfo?: boolean;
    includeLocation?: boolean;
    reminderMinutes?: number[];
  };
}

export interface ManageAvailabilityRequest {
  action: 'SET_WEEKLY' | 'SET_SPECIFIC_DATE' | 'BLOCK_TIME' | 'UNBLOCK_TIME' | 'SET_VACATION' | 'IMPORT_FROM_CALENDAR';
  weeklySchedule?: Array<{
    dayOfWeek: number;
    isAvailable: boolean;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      isAvailable?: boolean;
      serviceTypes?: string[];
      maxBookings?: number;
    }>;
    breaks?: Array<{
      startTime: string;
      endTime: string;
      description?: string;
    }>;
  }>;
  specificDates?: Array<{
    date: string;
    isAvailable: boolean;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      isAvailable?: boolean;
      serviceTypes?: string[];
      maxBookings?: number;
      specialPricing?: {
        multiplier?: number;
        fixedAmount?: number;
      };
    }>;
    reason?: string;
  }>;
  blockedPeriods?: Array<{
    startDateTime: string;
    endDateTime: string;
    reason: string;
    blockType: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'MAINTENANCE' | 'OTHER';
    isRecurring?: boolean;
    recurrencePattern?: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      interval: number;
      endDate?: string;
      occurrences?: number;
    };
  }>;
  calendarSync?: {
    syncFromCalendar?: boolean;
    calendarProvider?: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
    syncDirection?: 'IMPORT_ONLY' | 'EXPORT_ONLY' | 'BIDIRECTIONAL';
    conflictResolution?: 'CALENDAR_WINS' | 'MANUAL_WINS' | 'MERGE';
  };
  timeZone?: string;
  bufferTime?: {
    beforeBooking?: number;
    afterBooking?: number;
  };
  advanceBooking?: {
    minHours?: number;
    maxDays?: number;
  };
}

export const calendarApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Connect calendar
    connectCalendar: builder.mutation<{
      integration: CalendarIntegration;
      syncResult: CalendarSyncResult['stats'];
      message: string;
    }, ConnectCalendarRequest>({
      query: (data) => ({
        url: '/calendar/sync',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Calendar', 'Availability'],
    }),

    // Sync calendar
    syncCalendar: builder.mutation<{
      syncResult: CalendarSyncResult['stats'];
      conflicts: CalendarSyncResult['conflicts'];
      message: string;
      nextSyncAt?: string;
    }, {
      provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
      action: 'SYNC';
    }>({
      query: (data) => ({
        url: '/calendar/sync',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Calendar', 'Availability'],
    }),

    // Disconnect calendar
    disconnectCalendar: builder.mutation<{
      message: string;
    }, {
      provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
      action: 'DISCONNECT';
    }>({
      query: (data) => ({
        url: '/calendar/sync',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Calendar'],
    }),

    // Update calendar settings
    updateCalendarSettings: builder.mutation<{
      integration: Partial<CalendarIntegration>;
      message: string;
    }, {
      provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
      action: 'UPDATE_SETTINGS';
      settings: Partial<CalendarIntegration['settings']>;
    }>({
      query: (data) => ({
        url: '/calendar/sync',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Calendar'],
    }),

    // Get calendar integrations
    getCalendarIntegrations: builder.query<{
      integrations: CalendarIntegration[];
      totalCount: number;
    }, void>({
      query: () => ({
        url: '/calendar/integrations',
      }),
      providesTags: ['Calendar'],
    }),

    // Manage availability
    manageAvailability: builder.mutation<{
      message: string;
      slotsCreated?: number;
      datesUpdated?: number;
      periodsBlocked?: number;
      removedCount?: number;
      conflicts?: {
        count: number;
        bookings: Array<{
          id: string;
          scheduledDateTime: string;
          clientName: string;
          serviceName: string;
        }>;
        message: string;
      };
      vacation?: {
        id: string;
        startDateTime: string;
        endDateTime: string;
        reason: string;
      };
      importResult?: {
        eventsImported: number;
        slotsUpdated: number;
        conflicts: any[];
      };
      nextAvailableSlots?: MasterAvailability[];
    }, ManageAvailabilityRequest>({
      query: (data) => ({
        url: '/calendar/availability',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Availability', 'Calendar'],
    }),

    // Get master availability
    getMasterAvailability: builder.query<{
      weeklySchedule: MasterAvailability[];
      specificDates: MasterAvailability[];
      blockedSlots: BlockedTimeSlot[];
      settings: {
        timeZone: string;
        bufferTime?: {
          beforeBooking: number;
          afterBooking: number;
        };
        advanceBooking?: {
          minHours: number;
          maxDays: number;
        };
        calendarSync?: any;
      };
    }, { 
      startDate?: string; 
      endDate?: string; 
      includeBlocked?: boolean;
    }>({
      query: (params) => ({
        url: '/calendar/availability',
        params,
      }),
      providesTags: ['Availability'],
    }),

    // Get available time slots
    getAvailableTimeSlots: builder.query<{
      slots: Array<{
        date: string;
        timeSlots: Array<{
          startTime: string;
          endTime: string;
          isAvailable: boolean;
          maxBookings: number;
          currentBookings: number;
          serviceTypes?: string[];
          specialPricing?: {
            multiplier?: number;
            fixedAmount?: number;
          };
        }>;
      }>;
      totalSlots: number;
    }, {
      startDate: string;
      endDate: string;
      serviceType?: string;
      duration?: number;
    }>({
      query: (params) => ({
        url: '/calendar/available-slots',
        params,
      }),
      providesTags: ['Availability'],
    }),

    // Get calendar sync logs
    getCalendarSyncLogs: builder.query<{
      logs: Array<{
        id: string;
        syncType: 'MANUAL' | 'AUTOMATIC' | 'INITIAL';
        status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
        stats?: CalendarSyncResult['stats'];
        conflicts?: CalendarSyncResult['conflicts'];
        error?: string;
        createdAt: string;
      }>;
      totalCount: number;
    }, {
      page?: number;
      limit?: number;
      provider?: string;
    }>({
      query: (params) => ({
        url: '/calendar/sync-logs',
        params,
      }),
      providesTags: ['Calendar'],
    }),

    // Resolve calendar conflicts
    resolveCalendarConflicts: builder.mutation<{
      message: string;
      resolvedCount: number;
    }, {
      conflictIds: string[];
      resolution: 'ACCEPT_EXTERNAL' | 'ACCEPT_INTERNAL' | 'MERGE' | 'IGNORE';
    }>({
      query: (data) => ({
        url: '/calendar/resolve-conflicts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Calendar', 'Availability'],
    }),

    // Get calendar providers info
    getCalendarProviders: builder.query<{
      providers: Array<{
        id: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
        name: string;
        description: string;
        features: string[];
        setupInstructions: string[];
        isSupported: boolean;
        authUrl?: string;
      }>;
    }, void>({
      query: () => ({
        url: '/calendar/providers',
      }),
      providesTags: ['Calendar'],
    }),
  }),
});

export const {
  useConnectCalendarMutation,
  useSyncCalendarMutation,
  useDisconnectCalendarMutation,
  useUpdateCalendarSettingsMutation,
  useGetCalendarIntegrationsQuery,
  useManageAvailabilityMutation,
  useGetMasterAvailabilityQuery,
  useGetAvailableTimeSlotsQuery,
  useGetCalendarSyncLogsQuery,
  useResolveCalendarConflictsMutation,
  useGetCalendarProvidersQuery,
} = calendarApi;