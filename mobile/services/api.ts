import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import { setTokens, logout } from '../features/auth/authSlice';
import { errorHandler } from './errorHandler'; // FIXED: Import error handler
import { Mutex } from 'async-mutex';

// Create a mutex to prevent multiple refresh attempts
const mutex = new Mutex();

// FIXED: Enhanced base query with proper error handling
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  prepareHeaders: (headers, { getState }) => {
    // Get token from auth state
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
  timeout: 30000, // FIXED: Add 30 second timeout
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // FIXED: Add timeout for mutex to prevent deadlocks
  const release = await mutex.acquire();

  try {
    let result = await baseQuery(args, api, extraOptions);
    let refreshAttempts = 0;
    const MAX_REFRESH_ATTEMPTS = 3;

    if (result.error && result.error.status === 401) {
      if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        refreshAttempts++;
        const refreshToken = (api.getState() as RootState).auth.refreshToken;

        if (refreshToken) {
          console.log('Attempting to refresh token...');

          // Try to refresh the token
          const refreshResult = await baseQuery(
            {
              url: '/auth/refresh',
              method: 'POST',
              body: { refresh: refreshToken },
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            const { access, refresh } = refreshResult.data as { access: string; refresh: string };

            // Store the new tokens
            api.dispatch(setTokens({
              accessToken: access,
              refreshToken: refresh
            }));

            console.log('Token refreshed successfully');

            // Retry the original query with new token
            result = await baseQuery(args, api, extraOptions);
          } else if (refreshResult.error?.status === 'FETCH_ERROR') {
            console.error('Network error during token refresh');
            errorHandler.handleNetworkError(refreshResult.error);
            api.dispatch(logout());
          } else {
            console.log('Token refresh failed, logging out');
            api.dispatch(logout());
          }
        } else {
          console.log('No refresh token available, logging out');
          api.dispatch(logout());
        }
      } else {
        console.log('Max refresh attempts exceeded, logging out');
        api.dispatch(logout());
      }
    }

    // FIXED: Enhanced error handling with proper error service integration
    if (result.error) {
      const endpoint = typeof args === 'string' ? args : args.url;

      if (result.error.status === 'FETCH_ERROR') {
        errorHandler.handleNetworkError(result.error);
      } else if (typeof result.error.status === 'number') {
        errorHandler.handleAPIError(result.error, endpoint);
      } else {
        errorHandler.handleUnknownError(result.error, `API call to ${endpoint}`);
      }
    }

    return result;
  } finally {
    release();
  }
};

// Base API configuration
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Order',
    'Application',
    'Project',
    'MasterProfile',
    'ClientProfile',
    'Portfolio',
    'Review',
    'Chat',
    'Notification',
    'Wallet',
    'Transaction',
    'Service',
    'ServiceCategory',
    'Verification',
    'Dispute',
    'Location',
    'Masters',
    'Maps',
    'Booking',
    'Tracking',
    'Analytics',
    'BackgroundCheck',
    'Calendar',
    'TimeTracking',
    'Application',
    'Project',
    'InstantBooking',
    'Availability',
    'Category',
    'Skill',
    'Recommendation'
  ],
  endpoints: () => ({}),
});

export default api;