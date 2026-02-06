import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { api } from '../../services/api';
import type { RootState } from '../../store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof configureStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = configureStore({
      reducer: {
        auth: authReducer,
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
      preloadedState: preloadedState as any,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export everything
export * from '@testing-library/react-native';

// Mock data generators
export const mockUser = (overrides = {}) => ({
  id: 1,
  phone: '+996700123456',
  role: 'client' as const,
  firstName: 'John',
  lastName: 'Doe',
  ...overrides,
});

export const mockOrder = (overrides = {}) => ({
  id: 1,
  title: 'Test Order',
  description: 'Test Description',
  category: 1,
  category_name: 'Ремонт',
  city: 'Бишкек',
  budget_type: 'fixed' as const,
  budget_min: '10000',
  budget_max: null,
  status: 'active' as const,
  applications_count: 0,
  views_count: 0,
  created_at: new Date().toISOString(),
  client: {
    id: 1,
    name: 'John Doe',
    avatar: null,
    rating: '5.0',
  },
  required_skills: [],
  ...overrides,
});

export const mockProject = (overrides = {}) => ({
  id: 1,
  order_id: 1,
  order_title: 'Test Project',
  master_id: 2,
  master_name: 'Master Name',
  client_id: 1,
  client_name: 'Client Name',
  status: 'in_progress' as const,
  agreed_price: '50000',
  progress: 50,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockReview = (overrides = {}) => ({
  id: 1,
  rating: 5,
  comment: 'Great work!',
  is_anonymous: false,
  is_verified: true,
  helpful_count: 0,
  created_at: new Date().toISOString(),
  client: {
    id: 1,
    name: 'John Doe',
    avatar: null,
  },
  master: {
    id: 2,
    name: 'Master Name',
    avatar: null,
  },
  order: {
    id: 1,
    title: 'Test Order',
  },
  ...overrides,
});

export const mockChatRoom = (overrides = {}) => ({
  id: 1,
  participants: [
    {
      id: 1,
      user: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        avatar: null,
        role: 'client' as const,
      },
      is_online: true,
      joined_at: new Date().toISOString(),
    },
  ],
  unread_count: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockNotification = (overrides = {}) => ({
  id: 1,
  user: 1,
  title: 'Test Notification',
  message: 'Test message',
  notification_type: 'system' as const,
  is_read: false,
  is_sent: true,
  priority: 'normal' as const,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Wait utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));
