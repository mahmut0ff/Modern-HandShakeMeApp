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
        url: '/auth/telegram/complete',
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
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: any) => transformUserFromAPI(response),
    }),
    
    uploadAvatar: builder.mutation<{ message: string; avatar: string | null }, FormData>({
      query: (body) => ({
        url: '/users/me/avatar',
        method: 'POST',
        body,
        formData: true,
      }),
      invalidatesTags: ['User', 'MasterProfile', 'ClientProfile'],
    }),
    
    deleteAvatar: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/users/me/avatar',
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