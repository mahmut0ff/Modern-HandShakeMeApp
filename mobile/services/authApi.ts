import { api } from './api';
import { transformUserFromAPI } from '../utils/apiTransform';

export interface User {
  id: number;
  phone: string | null; // Может быть null для Telegram пользователей
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  isPhoneVerified: boolean;
  telegramId?: string;
  telegramUsername?: string;
  lastSeen?: string;
  createdAt: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// REMOVED: Phone-based registration and login interfaces
// Only Telegram authentication remains

export interface TelegramCompleteRequest {
  telegram_id: number;
  first_name: string;
  last_name: string;
  role: 'CLIENT' | 'MASTER';
  username?: string;
  photo_url?: string;
  citizenship?: string;
  city?: string;
}

export interface TelegramCompleteResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // REMOVED: Phone-based authentication endpoints
    // register, login, verifyPhone, resendVerification
    
    // Telegram authentication
    telegramComplete: builder.mutation<TelegramCompleteResponse, TelegramCompleteRequest>({
      query: (body) => ({
        url: '/auth/telegram/register',
        method: 'POST',
        body,
      }),
    }),
    
    logout: builder.mutation<void, { refresh: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
    }),
    
    refreshToken: builder.mutation<{ access: string; refresh?: string }, { refresh: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),
    
    getCurrentUser: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
      transformResponse: (response: any) => transformUserFromAPI(response),
    }),
    
    updateCurrentUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: '/users/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: any) => transformUserFromAPI(response),
    }),
    
    uploadAvatar: builder.mutation<{ message: string; avatar: string | null }, FormData>({
      query: (body) => ({
        url: '/users/avatar',
        method: 'POST',
        body,
        formData: true,
      }),
      invalidatesTags: ['User', 'MasterProfile', 'ClientProfile'],
    }),
    
    deleteAvatar: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/users/avatar',
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'MasterProfile', 'ClientProfile'],
    }),
  }),
});

export const {
  // REMOVED: Phone-based hooks
  // useRegisterMutation, useLoginMutation, useVerifyPhoneMutation, useResendVerificationMutation
  
  // Only Telegram and user management hooks remain
  useTelegramCompleteMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} = authApi;


// Direct API methods for screen compatibility (SMS auth)
import axios from 'axios';

const authClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Direct methods for screens
export const authApiDirect = {
  async requestCode(phone: string): Promise<{ message: string }> {
    const response = await authClient.post('/auth/telegram/code', { phone });
    return response.data;
  },

  async verifyCode(phone: string, code: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await authClient.post('/auth/telegram/check', { phone, code });
    return {
      user: response.data.user,
      accessToken: response.data.tokens?.access || response.data.accessToken,
      refreshToken: response.data.tokens?.refresh || response.data.refreshToken
    };
  },

  async register(data: {
    phone: string;
    firstName: string;
    lastName: string;
    role: 'CLIENT' | 'MASTER';
  }): Promise<{ message: string }> {
    const response = await authClient.post('/auth/telegram/register', {
      phone: data.phone,
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role
    });
    return response.data;
  }
};

// Re-export for backward compatibility
Object.assign(authApi, authApiDirect);

// Add methods to authApi for backward compatibility
(authApi as any).requestCode = authApiDirect.requestCode;
(authApi as any).verifyCode = authApiDirect.verifyCode;
(authApi as any).register = authApiDirect.register;
