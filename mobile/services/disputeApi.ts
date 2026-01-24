import { api } from './api';

export interface Dispute {
  id: number;
  project: {
    id: number;
    title: string;
    order_title?: string;
  };
  project_id?: number;
  project_title?: string;
  order_title?: string;
  initiator: {
    id: number;
    name: string;
    avatar: string | null;
    role: 'client' | 'master';
  };
  respondent: {
    id: number;
    name: string;
    avatar: string | null;
    role: 'client' | 'master';
  };
  reason: 'quality' | 'payment' | 'deadline' | 'communication' | 'scope' | 'other';
  description: string;
  status: 'open' | 'in_mediation' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resolution?: string;
  resolution_type?: 'refund' | 'partial_refund' | 'redo_work' | 'compensation' | 'no_action';
  amount_disputed?: string;
  amount_resolved?: string;
  evidence_files?: DisputeFile[];
  messages_count: number;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  closed_at?: string;
  mediator?: {
    id: number;
    name: string;
  };
}

export interface DisputeFile {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: number;
  uploaded_at: string;
}

export interface DisputeMessage {
  id: number;
  dispute: number;
  sender: {
    id: number;
    name: string;
    avatar: string | null;
    role: 'client' | 'master' | 'mediator' | 'admin';
  };
  message: string;
  message_type: 'text' | 'system' | 'resolution';
  is_internal: boolean;
  created_at: string;
}

export interface DisputeCreateData {
  project: number;
  reason: string;
  description: string;
  amount_disputed?: number;
  evidence_files?: FormData;
}

export interface DisputeUpdateData {
  description?: string;
  status?: string;
  priority?: string;
  resolution?: string;
  resolution_type?: string;
  amount_resolved?: number;
}

export interface DisputeMessageData {
  message: string;
  is_internal?: boolean;
}

export interface DisputeStats {
  total_disputes: number;
  open_disputes: number;
  in_mediation_disputes: number;
  resolved_disputes: number;
  win_rate?: number;
  average_resolution_time?: number;
}

export const disputeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get disputes
    getDisputes: builder.query<{ results: Dispute[]; count: number }, {
      status?: string;
      priority?: string;
      role?: 'initiator' | 'respondent';
      ordering?: string;
      page?: number;
      page_size?: number;
    }>({
      query: (params) => ({
        url: '/disputes',
        params,
      }),
      providesTags: ['Dispute'],
    }),

    // Get single dispute
    getDispute: builder.query<Dispute, number>({
      query: (id) => `/disputes/${id}`,
      providesTags: ['Dispute'],
    }),

    // Create dispute
    createDispute: builder.mutation<Dispute, DisputeCreateData>({
      query: (data) => ({
        url: '/disputes',
        method: 'POST',
        body: data.evidence_files || data,
        formData: !!data.evidence_files,
      }),
      invalidatesTags: ['Dispute', 'Project'],
    }),

    // Update dispute
    updateDispute: builder.mutation<Dispute, { id: number; data: DisputeUpdateData }>({
      query: ({ id, data }) => ({
        url: `/disputes/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Close dispute
    closeDispute: builder.mutation<Dispute, { id: number; resolution?: string }>({
      query: ({ id, resolution }) => ({
        url: `/disputes/${id}/close`,
        method: 'POST',
        body: { resolution },
      }),
      invalidatesTags: ['Dispute', 'Project'],
    }),

    // Escalate dispute
    escalateDispute: builder.mutation<Dispute, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/disputes/${id}/escalate`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Get dispute messages
    getDisputeMessages: builder.query<{ results: DisputeMessage[]; count: number }, {
      disputeId: number;
      page?: number;
      page_size?: number;
    }>({
      query: ({ disputeId, ...params }) => ({
        url: `/disputes/${disputeId}/messages`,
        params,
      }),
      providesTags: ['Dispute'],
    }),

    // Send dispute message
    sendDisputeMessage: builder.mutation<DisputeMessage, { disputeId: number; data: DisputeMessageData }>({
      query: ({ disputeId, data }) => ({
        url: `/disputes/${disputeId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Upload evidence file
    uploadEvidenceFile: builder.mutation<DisputeFile, { disputeId: number; file: FormData }>({
      query: ({ disputeId, file }) => ({
        url: `/disputes/${disputeId}/evidence`,
        method: 'POST',
        body: file,
        formData: true,
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Delete evidence file
    deleteEvidenceFile: builder.mutation<void, { disputeId: number; fileId: number }>({
      query: ({ disputeId, fileId }) => ({
        url: `/disputes/${disputeId}/evidence/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Accept resolution
    acceptResolution: builder.mutation<Dispute, number>({
      query: (id) => ({
        url: `/disputes/${id}/accept-resolution`,
        method: 'POST',
      }),
      invalidatesTags: ['Dispute', 'Project'],
    }),

    // Reject resolution
    rejectResolution: builder.mutation<Dispute, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/disputes/${id}/reject-resolution`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Request mediation
    requestMediation: builder.mutation<Dispute, number>({
      query: (id) => ({
        url: `/disputes/${id}/request-mediation`,
        method: 'POST',
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Get dispute stats
    getDisputeStats: builder.query<DisputeStats, void>({
      query: () => '/disputes/stats',
      providesTags: ['Dispute'],
    }),

    // Get my disputes
    getMyDisputes: builder.query<{ results: Dispute[]; count: number }, {
      status?: string;
      role?: 'initiator' | 'respondent';
      ordering?: string;
      page?: number;
    }>({
      query: (params) => ({
        url: '/disputes/my',
        params,
      }),
      providesTags: ['Dispute'],
    }),
  }),
});

export const {
  useGetDisputesQuery,
  useGetDisputeQuery,
  useCreateDisputeMutation,
  useUpdateDisputeMutation,
  useCloseDisputeMutation,
  useEscalateDisputeMutation,
  useGetDisputeMessagesQuery,
  useSendDisputeMessageMutation,
  useUploadEvidenceFileMutation,
  useDeleteEvidenceFileMutation,
  useAcceptResolutionMutation,
  useRejectResolutionMutation,
  useRequestMediationMutation,
  useGetDisputeStatsQuery,
  useGetMyDisputesQuery,
} = disputeApi;
