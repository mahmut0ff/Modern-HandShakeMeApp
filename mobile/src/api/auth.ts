import apiClient from './client';

export interface TelegramCodeResponse {
    code: string;
    visitorId: string;
    expiresIn: number;
    sessionId: string;
}

export interface TelegramCheckResponse {
    status: 'pending' | 'confirmed';
    telegramId?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
}

export interface AuthResponse {
    tokens: {
        access: string;
        refresh: string;
    };
    user: {
        id: string;
        phone: string;
        role: string;
        firstName: string;
        lastName: string;
        telegramId: string;
        avatar?: string;
    };
}

export const authApi = {
    getCode: (visitorId: string) =>
        apiClient.get<TelegramCodeResponse>(`/auth/telegram/code?visitorId=${visitorId}`),

    checkStatus: (sessionId: string) =>
        apiClient.get<TelegramCheckResponse>(`/auth/telegram/check?sessionId=${sessionId}`),

    register: (data: any) =>
        apiClient.post<AuthResponse>('/auth/telegram/register', data),

    refresh: (refreshToken: string) =>
        apiClient.post<{ access: string; refresh: string }>('/auth/refresh', { refreshToken }),

    logout: (refreshToken: string) =>
        apiClient.post('/auth/logout', { refreshToken }),

    switchRole: () =>
        apiClient.post<AuthResponse>('/auth/switch-role'),
};
