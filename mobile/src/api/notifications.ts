import apiClient from './client';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

export const notificationsApi = {
    getUnreadCount: () =>
        apiClient.get<{ count: number }>('/notifications/unread-count'),

    getNotifications: (params?: { page?: number; pageSize?: number }) =>
        apiClient.get<{ results: Notification[]; count: number }>('/notifications', { params }),

    markAsRead: (notificationId: string) =>
        apiClient.post(`/notifications/${notificationId}/read`),

    markAllAsRead: () =>
        apiClient.post('/notifications/mark-all-read'),

    deleteNotification: (notificationId: string) =>
        apiClient.delete(`/notifications/${notificationId}`),
};
