import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import { setTokens, logout } from '../features/auth/authSlice';
import { Mutex } from 'async-mutex';

// Create a mutex to prevent multiple refresh attempts
const mutex = new Mutex();

// Enhanced base query with token refresh logic
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
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait for any ongoing refresh attempts
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Check if we're not already refreshing
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      
      try {
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
          } else {
            console.log('Token refresh failed, logging out');
            api.dispatch(logout());
          }
        } else {
          console.log('No refresh token available, logging out');
          api.dispatch(logout());
        }
      } catch (error) {
        console.error('Error during token refresh:', error);
        api.dispatch(logout());
      } finally {
        release();
      }
    } else {
      // Wait for the ongoing refresh to complete
      await mutex.waitForUnlock();
      // Retry the original query
      result = await baseQuery(args, api, extraOptions);
    }
  }

  // Global error logging
  if (result.error) {
    console.error('API Error:', {
      endpoint: typeof args === 'string' ? args : args.url,
      status: result.error.status,
      data: result.error.data,
    });

    // Handle specific error types
    if (result.error.status === 'FETCH_ERROR') {
      console.error('Network error - check internet connection');
    } else if (result.error.status === 'TIMEOUT_ERROR') {
      console.error('Request timeout - server may be slow');
    }
  }

  return result;
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
    'Verification'
  ],
  endpoints: () => ({}),
});

export default api;