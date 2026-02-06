import { api } from './api';

// Backend routes:
// GET /availability - get master availability
// PUT /availability - update availability
// GET /availability/slots - get available slots
// POST /availability/book - book a slot

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
    // Calendar integration features - not available in backend yet
    // Using local storage/mock for now
    connectCalendar: builder.mutation<{
      integration: CalendarIntegration;
      syncResult: CalendarSyncResult['stats'];
      message: string;
    }, ConnectCalendarRequest>({
      queryFn: async (data) => {
        // Calendar sync not implemented in backend
        console.log('Calendar connect requested:', data.provider);
        return { 
          data: { 
            integration: {
              id: 'local-' + Date.now(),
              provider: data.provider,
              calendarId: 'local',
              calendarName: 'Local Calendar',
              isActive: false,
              settings: {
                syncDirection: 'BIDIRECTIONAL',
                syncFrequency: 'DAILY',
                syncBookings: true,
                syncAvailability: true,
                syncPersonalEvents: false,
                conflictResolution: 'MANUAL',
                timeZone: 'Asia/Bishkek',
                eventPrefix: '[Usta]',
                includeClientInfo: true,
                includeLocation: true,
                reminderMinutes: [30, 60],
              },
              createdAt: new Date().toISOString(),
            },
            syncResult: { eventsImported: 0, eventsExported: 0, eventsUpdated: 0, eventsDeleted: 0, conflictsFound: 0 },
            message: 'Интеграция с календарем пока недоступна' 
          } 
        };
      },
      invalidatesTags: ['Calendar', 'Availability'],
    }),

    syncCalendar: builder.mutation<{
      syncResult: CalendarSyncResult['stats'];
      conflicts: CalendarSyncResult['conflicts'];
      message: string;
      nextSyncAt?: string;
    }, {
      provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
      action: 'SYNC';
    }>({
      queryFn: async () => {
        return { 
          data: { 
            syncResult: { eventsImported: 0, eventsExported: 0, eventsUpdated: 0, eventsDeleted: 0, conflictsFound: 0 },
            conflicts: [],
            message: 'Синхронизация календаря пока недоступна' 
          } 
        };
      },
      invalidatesTags: ['Calendar', 'Availability'],
    }),

    disconnectCalendar: builder.mutation<{
      message: string;
    }, {
      provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
      action: 'DISCONNECT';
    }>({
      queryFn: async () => {
        return { data: { message: 'Календарь отключен' } };
      },
      invalidatesTags: ['Calendar'],
    }),

    updateCalendarSettings: builder.mutation<{
      integration: Partial<CalendarIntegration>;
      message: string;
    }, {
      provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
      action: 'UPDATE_SETTINGS';
      settings: Partial<CalendarIntegration['settings']>;
    }>({
      queryFn: async (data) => {
        return { 
          data: { 
            integration: { settings: data.settings },
            message: 'Настройки обновлены' 
          } 
        };
      },
      invalidatesTags: ['Calendar'],
    }),

    getCalendarIntegrations: builder.query<{
      integrations: CalendarIntegration[];
      totalCount: number;
    }, void>({
      queryFn: async () => {
        // No calendar integrations in backend
        return { data: { integrations: [], totalCount: 0 } };
      },
      providesTags: ['Calendar'],
    }),

    // Availability management - Backend: PUT /availability
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
        url: '/availability',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Availability', 'Calendar'],
    }),

    // Get master availability - Backend: GET /availability
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
        url: '/availability',
        params,
      }),
      transformResponse: (response: any) => {
        // Transform backend response to expected format
        return {
          weeklySchedule: response.weeklySchedule || response.weekly_schedule || [],
          specificDates: response.specificDates || response.specific_dates || [],
          blockedSlots: response.blockedSlots || response.blocked_slots || [],
          settings: response.settings || {
            timeZone: 'Asia/Bishkek',
            bufferTime: { beforeBooking: 15, afterBooking: 15 },
            advanceBooking: { minHours: 2, maxDays: 30 },
          },
        };
      },
      providesTags: ['Availability'],
    }),

    // Get available time slots - Backend: GET /availability/slots
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
      masterId?: string;
    }>({
      query: (params) => ({
        url: '/availability/slots',
        params,
      }),
      transformResponse: (response: any) => {
        const slots = response.slots || response || [];
        return {
          slots: Array.isArray(slots) ? slots : [],
          totalSlots: slots.length || 0,
        };
      },
      providesTags: ['Availability'],
    }),

    // Book a slot - Backend: POST /availability/book
    bookSlot: builder.mutation<{
      booking: {
        id: string;
        date: string;
        startTime: string;
        endTime: string;
        status: string;
      };
      message: string;
    }, {
      masterId: string;
      date: string;
      startTime: string;
      endTime: string;
      serviceType?: string;
      notes?: string;
    }>({
      query: (data) => ({
        url: '/availability/book',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Availability'],
    }),

    // Calendar sync logs - not available in backend
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
      queryFn: async () => {
        return { data: { logs: [], totalCount: 0 } };
      },
      providesTags: ['Calendar'],
    }),

    // Resolve calendar conflicts - not available in backend
    resolveCalendarConflicts: builder.mutation<{
      message: string;
      resolvedCount: number;
    }, {
      conflictIds: string[];
      resolution: 'ACCEPT_EXTERNAL' | 'ACCEPT_INTERNAL' | 'MERGE' | 'IGNORE';
    }>({
      queryFn: async () => {
        return { data: { message: 'Конфликты разрешены', resolvedCount: 0 } };
      },
      invalidatesTags: ['Calendar', 'Availability'],
    }),

    // Get calendar providers info - return static data
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
      queryFn: async () => {
        return {
          data: {
            providers: [
              {
                id: 'GOOGLE' as const,
                name: 'Google Calendar',
                description: 'Синхронизация с Google Calendar',
                features: ['Двусторонняя синхронизация', 'Автоматические напоминания'],
                setupInstructions: ['Войдите в Google аккаунт', 'Разрешите доступ к календарю'],
                isSupported: false,
              },
              {
                id: 'OUTLOOK' as const,
                name: 'Outlook Calendar',
                description: 'Синхронизация с Microsoft Outlook',
                features: ['Двусторонняя синхронизация', 'Интеграция с Teams'],
                setupInstructions: ['Войдите в Microsoft аккаунт', 'Разрешите доступ к календарю'],
                isSupported: false,
              },
              {
                id: 'APPLE' as const,
                name: 'Apple Calendar',
                description: 'Синхронизация с iCloud Calendar',
                features: ['Синхронизация с iOS устройствами'],
                setupInstructions: ['Войдите в Apple ID', 'Разрешите доступ к календарю'],
                isSupported: false,
              },
              {
                id: 'CALDAV' as const,
                name: 'CalDAV',
                description: 'Универсальный протокол календаря',
                features: ['Поддержка любого CalDAV сервера'],
                setupInstructions: ['Введите URL сервера', 'Введите учетные данные'],
                isSupported: false,
              },
            ],
          },
        };
      },
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
  useBookSlotMutation,
  useGetCalendarSyncLogsQuery,
  useResolveCalendarConflictsMutation,
  useGetCalendarProvidersQuery,
} = calendarApi;
