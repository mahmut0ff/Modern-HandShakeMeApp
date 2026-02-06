import { api } from './api';
import type { PaginatedResponse, OrderQueryParams } from '../types/api';
import { normalizeOrder, normalizePaginatedResponse } from '../utils/normalizers';

// Local types for this API (more specific than global types)
export interface Category {
  id: number;
  name: string;
  slug?: string;
  parent: number | null;
  icon: string;
  children?: Category[];
}

export interface Skill {
  id: number;
  name: string;
  category: number;
}

export interface OrderClient {
  id: number;
  name: string;
  avatar: string | null;
  rating: string;
  phone?: string | null;
}

export interface Order {
  id: number;
  client: OrderClient;
  client_name?: string;
  client_avatar?: string | null;
  client_rating?: string;
  client_phone?: string | null;
  category: number;
  category_name: string;
  subcategory?: number | null;
  subcategory_name?: string;
  required_skills?: number[];
  skills_list?: { id: number; name: string }[];
  title: string;
  description: string;
  city: string;
  address?: string;
  hide_address?: boolean;
  budget_type?: 'fixed' | 'range' | 'negotiable';
  budget_min?: string | number | null;
  budget_max?: string | number | null;
  budget_display?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_urgent?: boolean;
  work_volume?: string;
  floor?: number;
  has_elevator?: boolean;
  material_status?: 'client_provides' | 'master_provides' | 'master_buys' | 'need_consultation' | 'to_discuss';
  has_electricity?: boolean;
  has_water?: boolean;
  can_store_tools?: boolean;
  has_parking?: boolean;
  required_experience?: string | number;
  need_team?: boolean;
  additional_requirements?: string;
  is_public?: boolean;
  auto_close_applications?: boolean;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  applications_count: number;
  views_count: number;
  is_favorite?: boolean;
  is_favorited?: boolean;
  has_applied?: boolean;
  application_id?: number | null;
  files?: OrderFile[];
  created_at: string;
  updated_at?: string;
  expires_at?: string;
  deadline?: string;
}

export interface OrderFile {
  id: number;
  file: string;
  file_url?: string;
  file_type: 'photo' | 'video' | 'document';
  thumbnail?: string;
  order_num?: number;
  created_at?: string;
}

export interface OrderCreateData {
  category: number;
  subcategory?: number;
  required_skills?: number[];
  title: string;
  description: string;
  city: string;
  address: string;
  hide_address?: boolean;
  budget_type: 'fixed' | 'range' | 'negotiable';
  budget_min?: number;
  budget_max?: number;
  start_date?: string;
  end_date?: string;
  floor?: number;
  has_elevator?: boolean | null;
  material_status?: string;
  has_electricity?: boolean | null;
  has_water?: boolean | null;
  can_store_tools?: boolean | null;
  has_parking?: boolean | null;
  required_experience?: string;
  need_team?: boolean;
  additional_requirements?: string;
  is_urgent?: boolean;
  work_volume?: string;
  is_public?: boolean;
  auto_close_applications?: boolean;
}

export interface OrderSearchParams {
  category?: number;
  city?: string;
  budget_min?: number;
  budget_max?: number;
  is_urgent?: boolean;
  status?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export const orderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Categories
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      transformResponse: (response: any) => {
        if (response && typeof response === 'object' && 'results' in response) {
          return response.results;
        }
        return response;
      },
    }),
    getCategorySkillsForOrder: builder.query<Skill[], number>({
      query: (categoryId) => `/categories/${categoryId}/skills`,
    }),

    // Orders
    getOrders: builder.query<{ results: Order[]; count: number }, OrderSearchParams>({
      query: (params) => ({
        url: '/orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<Order, number>({
      query: (id) => `/orders/${id}`,
      providesTags: ['Order'],
    }),
    createOrder: builder.mutation<Order, OrderCreateData>({
      query: (data) => ({
        url: '/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),
    updateOrder: builder.mutation<Order, { id: number; data: Partial<OrderCreateData> }>({
      query: ({ id, data }) => ({
        url: `/orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),
    deleteOrder: builder.mutation<void, number>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),

    // Favorites
    addToFavorites: builder.mutation<void, number>({
      query: (orderId) => ({
        url: `/orders/${orderId}/favorites`,
        method: 'POST',
      }),
      invalidatesTags: ['Order'],
    }),
    removeFromFavorites: builder.mutation<void, number>({
      query: (orderId) => ({
        url: `/orders/${orderId}/favorites`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),

    // My orders (for clients)
    getMyOrders: builder.query<Order[], { status?: string } | undefined>({
      query: (params) => ({
        url: '/orders/my',
        params,
      }),
      transformResponse: (response: any) => {
        if (response && typeof response === 'object' && 'results' in response) {
          return response.results;
        }
        return response;
      },
      providesTags: ['Order'],
    }),

    // Get single order
    getOrder: builder.query<Order, number>({
      query: (id) => `/orders/${id}`,
      providesTags: ['Order'],
    }),

    // Order files
    getOrderFiles: builder.query<OrderFile[], number>({
      query: (orderId) => `/orders/${orderId}/files`,
      providesTags: ['Order'],
    }),
    addOrderFile: builder.mutation<OrderFile, { orderId: number; file: FormData }>({
      query: ({ orderId, file }) => ({
        url: `/orders/${orderId}/files`,
        method: 'POST',
        body: file,
        formData: true,
      }),
      invalidatesTags: ['Order'],
    }),
    deleteOrderFile: builder.mutation<void, { orderId: number; fileId: number }>({
      query: ({ orderId, fileId }) => ({
        url: `/orders/${orderId}/files`,
        method: 'DELETE',
        body: { fileId },
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategorySkillsForOrderQuery,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useGetMyOrdersQuery,
  useGetOrderQuery,
  useGetOrderFilesQuery,
  useAddOrderFileMutation,
  useDeleteOrderFileMutation,
} = orderApi;