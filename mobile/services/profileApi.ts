import { api } from './api';
import { Review } from './reviewApi';
import { normalizeMasterProfile } from '../utils/normalizers';
import type { ClientDashboardStats, MasterDashboardStats } from '../types/api';

export interface MasterProfile {
  id: number;
  user: {
    id: number;
    phone: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar?: string;
    is_phone_verified: boolean;
    last_seen?: string;
    created_at: string;
  };
  user_id?: number;
  user_phone?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_full_name?: string;
  user_avatar?: string | null;
  user_is_phone_verified?: boolean;
  user_last_seen?: string;
  user_created_at?: string;
  categories: number[];
  categories_list?: { id: number; name: string }[];
  skills: number[];
  skills_list?: { id: number; name: string }[];
  company_name?: string;
  bio?: string;
  experience_years?: number;
  hourly_rate?: string;
  min_order_amount?: string;
  max_order_amount?: string;
  city: string;
  address?: string;
  work_radius?: number;
  languages?: string[];
  certifications?: string[];
  education?: string;
  work_schedule?: string;
  response_time?: string;
  is_verified: boolean;
  is_available: boolean;
  is_premium: boolean;
  has_transport: boolean;
  has_tools: boolean;
  rating: string;
  reviews_count: number;
  completed_orders: number;
  success_rate: string;
  repeat_clients: number;
  avg_response_time?: string;
  portfolio_items?: PortfolioItem[];
  reviews?: Review[];
  created_at: string;
  updated_at?: string;
}

export interface ClientProfile {
  id: number;
  user: {
    id: number;
    phone: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar: string | null;
    is_phone_verified: boolean;
    last_seen?: string;
    created_at: string;
  };
  user_id?: number;
  user_phone?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_full_name?: string;
  user_avatar?: string | null;
  user_is_phone_verified?: boolean;
  user_last_seen?: string;
  user_created_at?: string;
  bio?: string;
  city: string;
  address?: string;
  company_name?: string;
  company_type?: string;
  preferred_contact_method?: 'phone' | 'chat' | 'email';
  rating: string;
  reviews_count: number;
  total_orders: number;
  completed_orders: number;
  avg_budget: string;
  created_at: string;
  updated_at?: string;
}

export interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  category: number;
  category_name?: string;
  images: PortfolioImage[];
  price?: string;
  duration?: string;
  client_name?: string;
  completion_date?: string;
  is_featured: boolean;
  order_num: number;
  created_at: string;
}

export interface PortfolioImage {
  id: number;
  image: string;
  image_url: string;
  thumbnail?: string;
  order_num: number;
  created_at: string;
}

export interface MasterProfileUpdateData {
  // Basic info
  first_name?: string;
  last_name?: string;
  
  // Professional info
  company_name?: string;
  description?: string;
  bio?: string;
  experience_years?: string | number;
  
  // Location
  city?: string;
  address?: string;
  travel_radius?: string | number;
  
  // Work conditions
  has_transport?: boolean;
  has_tools?: boolean;
  can_purchase_materials?: boolean;
  
  // Rates
  hourly_rate?: string | number;
  daily_rate?: string | number;
  min_order_cost?: string | number;
  
  // Working hours
  working_hours?: Record<string, string>;
  
  // Categories and skills
  categories?: (number | string)[];
  skills?: (number | string)[];
  
  // Availability
  is_available?: boolean;
  
  // Legacy fields for backward compatibility
  min_order_amount?: number;
  max_order_amount?: number;
  work_radius?: number;
  languages?: string[];
  certifications?: string[];
  education?: string;
  work_schedule?: string;
}

export interface ClientProfileUpdateData {
  // Basic info
  first_name?: string;
  last_name?: string;
  
  // About - support both field names
  about?: string;
  bio?: string;
  
  // Location
  city?: string;
  address?: string;
  
  // Company
  company_name?: string;
  company_type?: string;
  
  // Contact preferences
  preferred_contact_method?: 'phone' | 'chat' | 'email';
}

export interface PortfolioItemCreateData {
  title: string;
  description?: string;
  category: number;
  price?: number;
  duration?: string;
  client_name?: string;
  completion_date?: string;
  is_featured?: boolean;
}

export interface PortfolioItemUpdateData {
  title?: string;
  description?: string;
  category?: number;
  price?: number;
  duration?: string;
  client_name?: string;
  completion_date?: string;
  is_featured?: boolean;
}

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard stats
    getClientDashboardStats: builder.query<ClientDashboardStats, void>({
      query: () => '/clients/me/dashboard-stats',
      providesTags: ['ClientProfile'],
    }),

    getMasterDashboardStats: builder.query<MasterDashboardStats, void>({
      query: () => '/masters/me/dashboard-stats',
      providesTags: ['MasterProfile'],
    }),

    // Master profiles
    getMasterProfile: builder.query<MasterProfile, number>({
      query: (id) => `/masters/${id}`,
      providesTags: ['MasterProfile'],
    }),

    getMyMasterProfile: builder.query<MasterProfile, void>({
      query: () => '/masters/me',
      providesTags: ['MasterProfile'],
    }),

    updateMasterProfile: builder.mutation<MasterProfile, MasterProfileUpdateData>({
      query: (data) => ({
        url: '/masters/me',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['MasterProfile', 'User'],
    }),

    searchMasters: builder.query<{ results: MasterProfile[]; count: number }, {
      category?: number;
      city?: string;
      min_rating?: number;
      max_hourly_rate?: number;
      is_verified?: boolean;
      is_available?: boolean;
      search?: string;
      ordering?: string;
      page?: number;
    }>({
      query: (params) => ({
        url: '/masters',
        params,
      }),
      transformResponse: (response: any) => {
        // Handle both array and paginated responses
        if (Array.isArray(response)) {
          return {
            results: response.map(normalizeMasterProfile),
            count: response.length,
          };
        }
        return {
          results: (response.results || []).map(normalizeMasterProfile),
          count: response.count || 0,
        };
      },
      providesTags: ['MasterProfile'],
    }),

    // Client profiles
    getClientProfile: builder.query<ClientProfile, number>({
      query: (id) => `/clients/${id}`,
      providesTags: ['ClientProfile'],
    }),

    getMyClientProfile: builder.query<ClientProfile, void>({
      query: () => '/clients/me',
      providesTags: ['ClientProfile'],
    }),

    updateClientProfile: builder.mutation<ClientProfile, ClientProfileUpdateData>({
      query: (data) => ({
        url: '/clients/me',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ClientProfile', 'User'],
    }),

    // Portfolio - Backend routes: GET/POST /portfolio, PUT/DELETE /portfolio/:itemId
    getMasterPortfolio: builder.query<PortfolioItem[], number>({
      query: (masterId) => `/portfolio?masterId=${masterId}`,
      providesTags: ['Portfolio'],
    }),

    getMyPortfolio: builder.query<PortfolioItem[], void>({
      query: () => '/portfolio',
      providesTags: ['Portfolio'],
    }),

    createPortfolioItem: builder.mutation<PortfolioItem, PortfolioItemCreateData>({
      query: (data) => ({
        url: '/portfolio',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Portfolio'],
    }),

    updatePortfolioItem: builder.mutation<PortfolioItem, { id: number; data: PortfolioItemUpdateData }>({
      query: ({ id, data }) => ({
        url: `/portfolio/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Portfolio'],
    }),

    deletePortfolioItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/portfolio/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Portfolio'],
    }),

    // Note: Image upload endpoints need to be added to backend if needed
    addPortfolioImage: builder.mutation<PortfolioImage, { itemId: number; image: FormData }>({
      query: ({ itemId, image }) => ({
        url: `/portfolio/${itemId}`,
        method: 'PUT',
        body: image,
        formData: true,
      }),
      invalidatesTags: ['Portfolio'],
    }),

    deletePortfolioImage: builder.mutation<void, number>({
      query: (imageId) => ({
        url: `/portfolio/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Portfolio'],
    }),
  }),
});

export const {
  useGetClientDashboardStatsQuery,
  useGetMasterDashboardStatsQuery,
  useGetMasterProfileQuery,
  useGetMyMasterProfileQuery,
  useUpdateMasterProfileMutation,
  useSearchMastersQuery,
  useGetClientProfileQuery,
  useGetMyClientProfileQuery,
  useUpdateClientProfileMutation,
  useGetMasterPortfolioQuery,
  useGetMyPortfolioQuery,
  useCreatePortfolioItemMutation,
  useUpdatePortfolioItemMutation,
  useDeletePortfolioItemMutation,
  useAddPortfolioImageMutation,
  useDeletePortfolioImageMutation,
} = profileApi;