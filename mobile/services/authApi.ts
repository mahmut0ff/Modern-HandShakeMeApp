import { api } from './api';

export interface User {
  id: number;
  phone: string;
  role: 'master' | 'client' | 'admin';
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar?: string;
  is_phone_verified: boolean;
  two_factor_enabled: boolean;
  last_seen?: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterRequest {
  phone: string;
  code?: string;
  role?: 'master' | 'client';
  first_name?: string;
  last_name?: string;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface LoginRequest {
  phone: string;
  code?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface VerifyPhoneResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
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
    
    verifyPhone: builder.mutation<VerifyPhoneResponse, VerifyPhoneRequest>({
      query: (body) => ({
        url: '/auth/verify-phone',
        method: 'POST',
        body,
      }),
    }),
    
    resendVerification: builder.mutation<{ message: string }, { phone: string }>({
      query: (body) => ({
        url: '/auth/resend-verification',
        method: 'POST',
        body,
      }),
    }),
    
    getCurrentUser: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    
    updateCurrentUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: '/users/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
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
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useVerifyPhoneMutation,
  useResendVerificationMutation,
  useGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} = authApi;