import { api } from './api';

export interface Notification {
  id: number;
  user: number;
  title: string;
  message: string;
  notification_type: 
    | 'order_created'
    | 'order_updated'
    | 'application_received'
    | 'application_accepted'
    | 'application_rejected'
    | 'project_started'
    | 'project_completed'
    | 'project_cancelled'
    | 'payment_received'
    | 'payment_sent'
    | 'review_received'
    | 'message_received'
    | 'system'
    | 'promotion';
  related_object_type?: 'order' | 'application' | 'project' | 'payment' | 'review' | 'message';
  related_object_id?: number;
  data?: Record<string, any>;
  is_read: boolean;
  is_sent: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  sent_at?: string;
}

export interface NotificationSettings {
  id: number;
  user: number;
  
  // Email notifications
  email_order_updates: boolean;
  email_application_updates: boolean;
  email_project_updates: boolean;
  email_payment_updates: boolean;
  email_review_updates: boolean;
  email_message_updates: boolean;
  email_marketing: boolean;
  
  // Push notifications
  push_order_updates: boolean;
  push_application_updates: boolean;
  push_project_updates: boolean;
  push_payment_updates: boolean;
  push_review_updates: boolean;
  push_message_updates: boolean;
  push_marketing: boolean;
  
  // SMS notifications
  sms_order_updates: boolean;
  sms_application_updates: boolean;
  sms_project_updates: boolean;
  sms_payment_updates: boolean;
  sms_security_alerts: boolean;
  
  // General settings
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
  
  created_at: string;
  updated_at?: string;
}

export interface NotificationSettingsUpdateData {
  email_order_updates?: boolean;
  email_application_updates?: boolean;
  email_project_updates?: boolean;
  email_payment_updates?: boolean;
  email_review_updates?: boolean;
  email_message_updates?: boolean;
  email_marketing?: boolean;
  
  push_order_updates?: boolean;
  push_application_updates?: boolean;
  push_project_updates?: boolean;
  push_payment_updates?: boolean;
  push_review_updates?: boolean;
  push_message_updates?: boolean;
  push_marketing?: boolean;
  
  sms_order_updates?: boolean;
  sms_application_updates?: boolean;
  sms_project_updates?: boolean;
  sms_payment_updates?: boolean;
  sms_security_alerts?: boolean;
  
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
}

export interface PushTokenData {
  token: string;
  device_type: 'ios' | 'android';
  device_id?: string;
}

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Notifications - Backend: GET /notifications (no individual notification GET)
    getNotifications: builder.query<{ results: Notification[]; count: number }, {
      is_read?: boolean;
      notification_type?: string;
      priority?: string;
      page?: number;
      page_size?: number;
    }>({
      query: (params) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),

    getNotification: builder.query<Notification, number>({
      query: (id) => ({
        url: '/notifications',
        params: { id },
      }),
      transformResponse: (response: any) => {
        if (Array.isArray(response.results)) {
          return response.results[0];
        }
        return response;
      },
      providesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation<Notification, number>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Note: Push token endpoints not in routes.json - using notification settings

    markAllNotificationsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation<void, number>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteAllNotifications: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),

    // Notification settings - Backend: GET/PUT /notifications/settings
    getNotificationSettings: builder.query<NotificationSettings, void>({
      query: () => '/notifications/settings',
      providesTags: ['Notification'],
    }),

    updateNotificationSettings: builder.mutation<NotificationSettings, NotificationSettingsUpdateData>({
      query: (data) => ({
        url: '/notifications/settings',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Notification'],
    }),

    // Push token management - use notification settings endpoint
    registerPushToken: builder.mutation<{ message: string }, PushTokenData>({
      query: (data) => ({
        url: '/notifications/settings',
        method: 'PUT',
        body: { push_token: data.token, device_type: data.device_type, device_id: data.device_id },
      }),
    }),

    updatePushToken: builder.mutation<{ message: string }, PushTokenData>({
      query: (data) => ({
        url: '/notifications/settings',
        method: 'PUT',
        body: { push_token: data.token, device_type: data.device_type, device_id: data.device_id },
      }),
    }),

    deletePushToken: builder.mutation<{ message: string }, { token: string }>({
      query: (data) => ({
        url: '/notifications/settings',
        method: 'PUT',
        body: { push_token: null, remove_token: data.token },
      }),
    }),

    // Test notification - not available in backend, return mock success
    sendTestNotification: builder.mutation<{ message: string }, { title: string; message: string }>({
      queryFn: async ({ title, message }) => {
        // Test notification endpoint not available in backend
        console.log('Test notification:', title, message);
        return { data: { message: 'Test notification sent (local only)' } };
      },
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useGetUnreadCountQuery,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useRegisterPushTokenMutation,
  useUpdatePushTokenMutation,
  useDeletePushTokenMutation,
  useSendTestNotificationMutation,
} = notificationApi;