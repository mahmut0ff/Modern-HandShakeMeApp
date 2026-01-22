import { api } from './api';

export interface Application {
  id: number;
  order: number;
  order_title?: string;
  order_budget_display?: string;
  master: {
    id: number;
    name: string;
    avatar: string | null;
    rating: string;
    phone?: string | null;
  };
  master_name?: string;
  master_avatar?: string | null;
  master_rating?: string;
  master_phone?: string | null;
  client: {
    id: number;
    name: string;
    avatar: string | null;
    rating: string;
    phone?: string | null;
  };
  client_name?: string;
  client_avatar?: string | null;
  client_rating?: string;
  client_phone?: string | null;
  proposed_price: string;
  message: string;
  estimated_duration?: string;
  start_date?: string;
  status: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'cancelled';
  status_display?: string;
  created_at: string;
  updated_at?: string;
  viewed_at?: string;
  responded_at?: string;
}

export interface ApplicationCreateData {
  order: number;
  proposed_price: number;
  message: string;
  estimated_duration?: string;
  start_date?: string;
}

export interface ApplicationUpdateData {
  proposed_price?: number;
  message?: string;
  estimated_duration?: string;
  start_date?: string;
}

export interface ApplicationResponse {
  status: 'accepted' | 'rejected';
  message?: string;
}

export const applicationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get applications for an order (for clients)
    getOrderApplications: builder.query<Application[], number>({
      query: (orderId) => `/orders/${orderId}/applications`,
      providesTags: ['Application'],
    }),

    // Get my applications (for masters)
    getMyApplications: builder.query<Application[], { status?: string; ordering?: string }>({
      query: (params) => ({
        url: '/applications/my',
        params,
      }),
      transformResponse: (response: any) => {
        if (response && typeof response === 'object' && 'results' in response) {
          return response.results;
        }
        return response;
      },
      providesTags: ['Application'],
    }),

    // Get single application
    getApplication: builder.query<Application, number>({
      query: (id) => `/applications/${id}`,
      providesTags: ['Application'],
    }),

    // Create application (for masters)
    createApplication: builder.mutation<Application, ApplicationCreateData>({
      query: (data) => ({
        url: '/applications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Application', 'Order'],
    }),

    // Update application (for masters)
    updateApplication: builder.mutation<Application, { id: number; data: ApplicationUpdateData }>({
      query: ({ id, data }) => ({
        url: `/applications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Application'],
    }),

    // Delete application (for masters)
    deleteApplication: builder.mutation<void, number>({
      query: (id) => ({
        url: `/applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Application', 'Order'],
    }),

    // Respond to application (for clients)
    respondToApplication: builder.mutation<Application, { id: number; data: ApplicationResponse }>({
      query: ({ id, data }) => ({
        url: `/applications/${id}/respond`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Application', 'Order', 'Project'],
    }),

    // Mark application as viewed (for clients)
    markApplicationViewed: builder.mutation<void, number>({
      query: (id) => ({
        url: `/applications/${id}/view`,
        method: 'POST',
      }),
      invalidatesTags: ['Application'],
    }),
  }),
});

export const {
  useGetOrderApplicationsQuery,
  useGetMyApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
  useRespondToApplicationMutation,
  useMarkApplicationViewedMutation,
} = applicationApi;