import apiClient from './client';

export interface Notification {
    id: string;
    userId: string;
    type: 'ORDER' | 'APPLICATION' | 'PROJECT' | 'REVIEW' | 'CHAT' | 'PAYMENT' | 'SYSTEM';
    title: string;
    message: string;
    data?: {
        referenceType?: 'order' | 'application' | 'chat' | 'message' | 'user' | 'system' | 'review';
        referenceId?: string;
        secondaryReferenceId?: string;
        [key: string]: any;
    };
    isRead: boolean;
    priority?: 'low' | 'normal' | 'high';
    createdAt: string;
    readAt?: string;
}

export interface NotificationSettings {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    newOrders: boolean;
    newApplications: boolean;
    applicationAccepted: boolean;
    applicationRejected: boolean;
    newMessages: boolean;
    projectUpdates: boolean;
    paymentReceived: boolean;
    reviewReceived: boolean;
}

export const notificationsApi = {
    getUnreadCount: () =>
        apiClient.get<{ count: number }>('/notifications/unread-count'),

    getNotifications: (params?: { page?: number; pageSize?: number }) =>
        apiClient.get<{ notifications: Notification[]; total: number; unreadCount: number }>('/notifications', { params }),

    markAsRead: (notificationId: string) =>
        apiClient.post(`/notifications/${notificationId}/read`),

    markAllAsRead: () =>
        apiClient.post('/notifications/read-all'),

    deleteNotification: (notificationId: string) =>
        apiClient.delete(`/notifications/${notificationId}`),

    deleteAll: () =>
        apiClient.delete('/notifications'),

    getSettings: () =>
        apiClient.get<NotificationSettings>('/notifications/settings'),

    updateSettings: (settings: Partial<NotificationSettings>) =>
        apiClient.put<NotificationSettings>('/notifications/settings', settings),
};
