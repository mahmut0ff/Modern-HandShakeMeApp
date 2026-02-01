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
        url: '/instant-booking/available-slots',
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
        url: '/instant-booking/create',
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
        url: '/instant-booking/manage',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['InstantBooking', 'Wallet', 'Notification'],
    }),

    // List bookings
    listBookings: builder.query<BookingListResponse, BookingListParams>({
      query: (params) => ({
        url: '/instant-booking/list',
        params,
      }),
      providesTags: ['InstantBooking'],
    }),

    // Get single booking details
    getBooking: builder.query<InstantBooking, string>({
      query: (bookingId) => ({
        url: `/instant-booking/${bookingId}`,
      }),
      providesTags: (result, error, bookingId) => [
        { type: 'InstantBooking', id: bookingId },
      ],
    }),

    // Get booking statistics
    getBookingStats: builder.query<{
      totalBookings: number;
      completedBookings: number;
      cancelledBookings: number;
      totalEarnings: number;
      averageRating: number;
      responseTime: number;
    }, { role?: 'client' | 'master'; period?: 'week' | 'month' | 'year' }>({
      query: (params) => ({
        url: '/instant-booking/stats',
        params,
      }),
      providesTags: ['InstantBooking'],
    }),

    // Get master's instant booking settings
    getMasterBookingSettings: builder.query<{
      instantBookingEnabled: boolean;
      autoConfirmEnabled: boolean;
      minimumNotice: number; // minutes
      maximumAdvanceBooking: number; // days
      urgentBookingFee: number; // percentage
      cancellationPolicy: string;
    }, void>({
      query: () => ({
        url: '/instant-booking/settings',
      }),
      providesTags: ['InstantBooking'],
    }),

    // Update master's instant booking settings
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
      query: (data) => ({
        url: '/instant-booking/settings',
        method: 'PUT',
        body: data,
      }),
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