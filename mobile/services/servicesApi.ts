import { api } from './api';

export interface Service {
  id: number;
  master: number;
  name: string;
  description?: string;
  category: number;
  category_name?: string;
  price_from: string;
  price_to?: string;
  unit: 'hour' | 'sqm' | 'piece' | 'project' | 'day';
  unit_display?: string;
  is_active: boolean;
  is_featured: boolean;
  order_num: number;
  created_at: string;
  updated_at?: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  parent?: number;
  is_active: boolean;
  order_num: number;
}

export interface ServiceCreateData {
  name: string;
  description?: string;
  category: number;
  price_from: number;
  price_to?: number;
  unit: 'hour' | 'sqm' | 'piece' | 'project' | 'day';
  is_active?: boolean;
  is_featured?: boolean;
}

export interface ServiceUpdateData {
  name?: string;
  description?: string;
  category?: number;
  price_from?: number;
  price_to?: number;
  unit?: 'hour' | 'sqm' | 'piece' | 'project' | 'day';
  is_active?: boolean;
  is_featured?: boolean;
}

export const servicesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Master services
    getMyServices: builder.query<Service[], void>({
      query: () => '/masters/me/services',
      providesTags: ['Service'],
    }),

    getMasterServices: builder.query<Service[], number>({
      query: (masterId) => `/masters/${masterId}/services`,
      providesTags: ['Service'],
    }),

    createService: builder.mutation<Service, ServiceCreateData>({
      query: (data) => ({
        url: '/masters/me/services',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Service'],
    }),

    updateService: builder.mutation<Service, { id: number; data: ServiceUpdateData }>({
      query: ({ id, data }) => ({
        url: `/masters/me/services/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Service'],
    }),

    deleteService: builder.mutation<void, number>({
      query: (id) => ({
        url: `/masters/me/services/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Service'],
    }),

    toggleServiceStatus: builder.mutation<Service, number>({
      query: (id) => ({
        url: `/masters/me/services/${id}/toggle-status`,
        method: 'POST',
      }),
      invalidatesTags: ['Service'],
    }),

    reorderServices: builder.mutation<Service[], { service_ids: number[] }>({
      query: (data) => ({
        url: '/masters/me/services/reorder',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Service'],
    }),

    // Service categories
    getServiceCategories: builder.query<ServiceCategory[], void>({
      query: () => '/service-categories',
      providesTags: ['ServiceCategory'],
    }),

    getServiceCategory: builder.query<ServiceCategory, number>({
      query: (id) => `/service-categories/${id}`,
      providesTags: ['ServiceCategory'],
    }),

    // Search services
    searchServices: builder.query<{ results: Service[]; count: number }, {
      category?: number;
      city?: string;
      min_price?: number;
      max_price?: number;
      unit?: string;
      search?: string;
      ordering?: string;
      page?: number;
    }>({
      query: (params) => ({
        url: '/services/search',
        params,
      }),
      providesTags: ['Service'],
    }),
  }),
});

export const {
  useGetMyServicesQuery,
  useGetMasterServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useToggleServiceStatusMutation,
  useReorderServicesMutation,
  useGetServiceCategoriesQuery,
  useGetServiceCategoryQuery,
  useSearchServicesQuery,
} = servicesApi;