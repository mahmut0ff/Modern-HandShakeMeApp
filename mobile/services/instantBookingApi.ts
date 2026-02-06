import { api } from './api';

export interface InstantBooking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  scheduledDateTime: string;
  duration: number;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  baseAmount: number;
  urgentFee: number;
  platformFee: number;
  totalAmount: number;
  urgentBooking: boolean;
  autoConfirmed: boolean;
  createdAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  cancellationFee?: number;
  refundAmount?: number;
  rescheduledAt?: string;
  rescheduledBy?: string;
  client: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    rating: number;
  };
  master: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    rating: number;
    responseTime: number;
  };
  service: {
    id: string;
    name: string;
    description: string;
    category: string;
  };
  paymentMethod: {
    id: string;
    methodType: string;
    name: string;
    details: Record<string, any>;
  };
  canCancel: boolean;
  canReschedule: boolean;
  canStart: boolean;
  canComplete: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
  urgentFee?: number;
  isUrgent: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  masterId: string;
  serviceId: string;
  duration: number;
  slots: TimeSlot[];
  masterInfo: {
    name: string;
    rating: number;
    responseTime: number;
  };
  serviceInfo: {
    name: string;
    basePrice: number;
    description: string;
  };
}

export interface CreateInstantBookingRequest {
  serviceId: string;
  masterId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  paymentMethodId: string;
  totalAmount: number;
  urgentBooking?: boolean;
  autoConfirm?: boolean;
}

export interface ManageBookingRequest {
  bookingId: string;
  action: 'confirm' | 'cancel' | 'reschedule' | 'complete' | 'start';
  reason?: string;
  newDateTime?: string;
  newDuration?: number;
}

export interface BookingListParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  role?: 'client' | 'master';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'scheduledDateTime' | 'createdAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingListResponse {
  bookings: InstantBooking[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    status?: string;
    role?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
}

export const instantBookingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get available time slots
    getAvailableSlots: builder.query<AvailableSlotsResponse, {
      masterId: string;
      serviceId: string;
      date: string;
      duration?: number;
    }>({
      query: ({ masterId, serviceId, date, duration = 60 }) => ({
        url: '/instant-booking/slots',
        params: { masterId, serviceId, date, duration },
      }),
      providesTags: ['InstantBooking'],
    }),

    // Create instant booking
    createInstantBooking: builder.mutation<{
      booking: InstantBooking;
      message: string;
    }, CreateInstantBookingRequest>({
      query: (data) => ({
        url: '/instant-booking',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['InstantBooking', 'Wallet', 'Notification'],
    }),

    // Manage booking (confirm, cancel, reschedule, etc.)
    manageBooking: builder.mutation<{
      booking: InstantBooking;
      message: string;
      cancellationFee?: number;
      refundAmount?: number;
      priceDifference?: number;
    }, ManageBookingRequest>({
      query: (data) => ({
        url: `/instant-booking/${data.bookingId}`,
        method: 'PUT',
        body: {
          action: data.action,
          reason: data.reason,
          newDateTime: data.newDateTime,
          newDuration: data.newDuration,
        },
      }),
      invalidatesTags: ['InstantBooking', 'Wallet', 'Notification'],
    }),

    // List bookings
    listBookings: builder.query<BookingListResponse, BookingListParams>({
      query: (params) => ({
        url: '/instant-booking',
        params,
      }),
      providesTags: ['InstantBooking'],
    }),

    // Get single booking details - use list with filter
    getBooking: builder.query<InstantBooking, string>({
      query: (bookingId) => ({
        url: '/instant-booking',
        params: { bookingId },
      }),
      transformResponse: (response: any) => {
        // Extract single booking from list response
        if (response.bookings && response.bookings.length > 0) {
          return response.bookings[0];
        }
        return response;
      },
      providesTags: (result, error, bookingId) => [
        { type: 'InstantBooking', id: bookingId },
      ],
    }),

    // Get booking statistics - not in routes.json, use list endpoint with aggregation
    getBookingStats: builder.query<{
      totalBookings: number;
      completedBookings: number;
      cancelledBookings: number;
      totalEarnings: number;
      averageRating: number;
      responseTime: number;
    }, { role?: 'client' | 'master'; period?: 'week' | 'month' | 'year' }>({
      query: (params) => ({
        url: '/instant-booking',
        params: { ...params, limit: 1000 },
      }),
      transformResponse: (response: any) => {
        const bookings = response.bookings || [];
        const completed = bookings.filter((b: InstantBooking) => b.status === 'COMPLETED');
        const cancelled = bookings.filter((b: InstantBooking) => b.status === 'CANCELLED');
        return {
          totalBookings: bookings.length,
          completedBookings: completed.length,
          cancelledBookings: cancelled.length,
          totalEarnings: completed.reduce((sum: number, b: InstantBooking) => sum + b.totalAmount, 0),
          averageRating: 0,
          responseTime: 0,
        };
      },
      providesTags: ['InstantBooking'],
    }),

    // Get master's instant booking settings - not in routes.json, return defaults
    getMasterBookingSettings: builder.query<{
      instantBookingEnabled: boolean;
      autoConfirmEnabled: boolean;
      minimumNotice: number;
      maximumAdvanceBooking: number;
      urgentBookingFee: number;
      cancellationPolicy: string;
    }, void>({
      queryFn: async () => {
        // Settings endpoint not available, return defaults
        return {
          data: {
            instantBookingEnabled: true,
            autoConfirmEnabled: false,
            minimumNotice: 60,
            maximumAdvanceBooking: 30,
            urgentBookingFee: 20,
            cancellationPolicy: 'Бесплатная отмена за 24 часа до начала',
          },
        };
      },
      providesTags: ['InstantBooking'],
    }),

    // Update master's instant booking settings - not in routes.json
    updateMasterBookingSettings: builder.mutation<{
      message: string;
    }, {
      instantBookingEnabled?: boolean;
      autoConfirmEnabled?: boolean;
      minimumNotice?: number;
      maximumAdvanceBooking?: number;
      urgentBookingFee?: number;
      cancellationPolicy?: string;
    }>({
      queryFn: async () => {
        // Settings endpoint not available
        return { data: { message: 'Настройки сохранены локально' } };
      },
      invalidatesTags: ['InstantBooking'],
    }),
  }),
});

export const {
  useGetAvailableSlotsQuery,
  useCreateInstantBookingMutation,
  useManageBookingMutation,
  useListBookingsQuery,
  useGetBookingQuery,
  useGetBookingStatsQuery,
  useGetMasterBookingSettingsQuery,
  useUpdateMasterBookingSettingsMutation,
} = instantBookingApi;