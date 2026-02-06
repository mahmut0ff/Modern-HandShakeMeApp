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
      query: () => '/services/my',
      providesTags: ['Service'],
    }),

    getMasterServices: builder.query<Service[], number>({
      query: (masterId) => `/services?masterId=${masterId}`,
      providesTags: ['Service'],
    }),

    createService: builder.mutation<Service, ServiceCreateData>({
      query: (data) => ({
        url: '/services',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Service'],
    }),

    updateService: builder.mutation<Service, { id: number; data: ServiceUpdateData }>({
      query: ({ id, data }) => ({
        url: `/services/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Service'],
    }),

    deleteService: builder.mutation<void, number>({
      query: (id) => ({
        url: `/services/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Service'],
    }),

    // Toggle service status - use PUT /services/:serviceId with is_active field
    toggleServiceStatus: builder.mutation<Service, number>({
      query: (id) => ({
        url: `/services/${id}`,
        method: 'PUT',
        body: { toggle_status: true },
      }),
      invalidatesTags: ['Service'],
    }),

    // Reorder services - use PUT /services/:serviceId with order_num field
    reorderServices: builder.mutation<Service[], { service_ids: number[] }>({
      query: (data) => ({
        url: '/services',
        method: 'PUT',
        body: { reorder: data.service_ids },
      }),
      invalidatesTags: ['Service'],
    }),

    // Service categories - Backend routes: GET /categories, GET /categories/:categoryId/skills
    getServiceCategories: builder.query<ServiceCategory[], void>({
      query: () => '/categories',
      providesTags: ['ServiceCategory'],
    }),

    getServiceCategory: builder.query<ServiceCategory, number>({
      query: (id) => `/categories/${id}/skills`,
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