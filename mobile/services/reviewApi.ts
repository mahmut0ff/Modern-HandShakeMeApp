import { api } from './api';

export interface Review {
  id: number;
  client: {
    id: number;
    name: string;
    avatar: string | null;
  };
  client_name?: string;
  client_avatar?: string | null;
  master: {
    id: number;
    name: string;
    avatar: string | null;
  };
  master_name?: string;
  master_avatar?: string | null;
  order: {
    id: number;
    title: string;
  };
  order_id?: number;
  order_title?: string;
  project?: {
    id: number;
    title: string;
  };
  project_id?: number;
  project_title?: string;
  rating: number;
  comment?: string;
  response?: string;
  is_anonymous: boolean;
  is_verified: boolean;
  helpful_count: number;
  is_helpful?: boolean;
  created_at: string;
  updated_at?: string;
  responded_at?: string;
}

export interface ReviewCreateData {
  order: number;
  project?: number;
  rating: number;
  comment?: string;
  is_anonymous?: boolean;
}

export interface ReviewUpdateData {
  rating?: number;
  comment?: string;
  is_anonymous?: boolean;
}

export interface ReviewResponseData {
  response: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: string;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recent_reviews: Review[];
}

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get reviews for a master
    getMasterReviews: builder.query<{ results: Review[]; count: number }, {
      masterId: number;
      rating?: number;
      is_verified?: boolean;
      ordering?: string;
      page?: number;
      page_size?: number;
    }>({
      query: ({ masterId, ...params }) => ({
        url: `/masters/${masterId}/reviews`,
        params,
      }),
      providesTags: ['Review'],
    }),

    // Get my reviews (as client or master)
    getMyReviews: builder.query<{ results: Review[]; count: number }, {
      role: 'client' | 'master';
      rating?: number;
      has_response?: boolean;
      ordering?: string;
      page?: number;
      page_size?: number;
    }>({
      query: (params) => ({
        url: '/reviews/my',
        params,
      }),
      providesTags: ['Review'],
    }),

    // Get single review
    getReview: builder.query<Review, number>({
      query: (id) => `/reviews/${id}`,
      providesTags: ['Review'],
    }),

    // Create review (for clients)
    createReview: builder.mutation<Review, ReviewCreateData>({
      query: (data) => ({
        url: '/reviews',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Review', 'MasterProfile'],
    }),

    // Update review (for clients)
    updateReview: builder.mutation<Review, { id: number; data: ReviewUpdateData }>({
      query: ({ id, data }) => ({
        url: `/reviews/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Review', 'MasterProfile'],
    }),

    // Delete review (for clients)
    deleteReview: builder.mutation<void, number>({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review', 'MasterProfile'],
    }),

    // Respond to review (for masters)
    respondToReview: builder.mutation<Review, { id: number; data: ReviewResponseData }>({
      query: ({ id, data }) => ({
        url: `/reviews/${id}/respond`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Review'],
    }),

    // Update review response (for masters)
    updateReviewResponse: builder.mutation<Review, { id: number; data: ReviewResponseData }>({
      query: ({ id, data }) => ({
        url: `/reviews/${id}/respond`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Review'],
    }),

    // Delete review response (for masters)
    deleteReviewResponse: builder.mutation<Review, number>({
      query: (id) => ({
        url: `/reviews/${id}/respond`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review'],
    }),

    // Mark review as helpful - Backend only has POST
    markReviewHelpful: builder.mutation<{ is_helpful: boolean; helpful_count: number }, number>({
      query: (id) => ({
        url: `/reviews/${id}/helpful`,
        method: 'POST',
      }),
      invalidatesTags: ['Review'],
    }),

    // Remove helpful mark - use same POST endpoint with toggle behavior
    removeReviewHelpful: builder.mutation<{ is_helpful: boolean; helpful_count: number }, number>({
      query: (id) => ({
        url: `/reviews/${id}/helpful`,
        method: 'POST',
        body: { remove: true },
      }),
      invalidatesTags: ['Review'],
    }),

    // Get review stats for a master - use master stats endpoint
    getMasterReviewStats: builder.query<ReviewStats, number>({
      query: (masterId) => `/masters/${masterId}/stats`,
      transformResponse: (response: any) => ({
        total_reviews: response.reviews_count || 0,
        average_rating: response.rating || '0',
        rating_distribution: response.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recent_reviews: response.recent_reviews || [],
      }),
      providesTags: ['Review'],
    }),

    // Get reviews that need response - use my reviews with filter
    getReviewsNeedingResponse: builder.query<Review[], void>({
      query: () => ({
        url: '/reviews/my',
        params: { role: 'master', has_response: false },
      }),
      transformResponse: (response: any) => response.results || response,
      providesTags: ['Review'],
    }),

    // Report review
    reportReview: builder.mutation<{ message: string }, { id: number; reason: string; details?: string }>({
      query: ({ id, reason, details }) => ({
        url: `/reviews/${id}/report`,
        method: 'POST',
        body: { reason, details },
      }),
    }),
  }),
});

export const {
  useGetMasterReviewsQuery,
  useGetMyReviewsQuery,
  useGetReviewQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useRespondToReviewMutation,
  useUpdateReviewResponseMutation,
  useDeleteReviewResponseMutation,
  useMarkReviewHelpfulMutation,
  useRemoveReviewHelpfulMutation,
  useGetMasterReviewStatsQuery,
  useGetReviewsNeedingResponseQuery,
  useReportReviewMutation,
} = reviewApi;