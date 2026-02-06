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

    // Update dispute - Backend: PUT /disputes/:disputeId/status
    updateDispute: builder.mutation<Dispute, { id: number; data: DisputeUpdateData }>({
      query: ({ id, data }) => ({
        url: `/disputes/${id}/status`,
        method: 'PUT',
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

    // Delete evidence file - use evidence endpoint with delete action
    deleteEvidenceFile: builder.mutation<void, { disputeId: number; fileId: number }>({
      query: ({ disputeId, fileId }) => ({
        url: `/disputes/${disputeId}/evidence`,
        method: 'POST',
        body: { action: 'delete', fileId },
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Accept resolution - Backend: POST /disputes/:disputeId/accept
    acceptResolution: builder.mutation<Dispute, number>({
      query: (id) => ({
        url: `/disputes/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['Dispute', 'Project'],
    }),

    // Reject resolution - use close endpoint with rejection
    rejectResolution: builder.mutation<Dispute, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/disputes/${id}/close`,
        method: 'POST',
        body: { resolution: 'rejected', reason },
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Request mediation - Backend: POST /disputes/:disputeId/mediation
    requestMediation: builder.mutation<Dispute, number>({
      query: (id) => ({
        url: `/disputes/${id}/mediation`,
        method: 'POST',
      }),
      invalidatesTags: ['Dispute'],
    }),

    // Get dispute stats - use disputes list with aggregation
    getDisputeStats: builder.query<DisputeStats, void>({
      query: () => '/disputes',
      transformResponse: (response: any) => {
        const disputes = response.results || response || [];
        const stats: DisputeStats = {
          total_disputes: disputes.length,
          open_disputes: disputes.filter((d: Dispute) => d.status === 'open').length,
          in_mediation_disputes: disputes.filter((d: Dispute) => d.status === 'in_mediation').length,
          resolved_disputes: disputes.filter((d: Dispute) => d.status === 'resolved').length,
        };
        return stats;
      },
      providesTags: ['Dispute'],
    }),

    // Get my disputes - use disputes list (backend filters by user automatically)
    getMyDisputes: builder.query<{ results: Dispute[]; count: number }, {
      status?: string;
      role?: 'initiator' | 'respondent';
      ordering?: string;
      page?: number;
    }>({
      query: (params) => ({
        url: '/disputes',
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


// Direct API methods for screen compatibility
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const disputeClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

disputeClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Direct methods for screens
export const disputeApiDirect = {
  async getDisputes(token: string, params?: { status?: string }): Promise<Dispute[]> {
    const response = await disputeClient.get('/disputes', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.results || response.data;
  },

  async getDispute(token: string, disputeId: string): Promise<Dispute> {
    const response = await disputeClient.get(`/disputes/${disputeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getDisputeMessages(token: string, disputeId: string): Promise<DisputeMessage[]> {
    const response = await disputeClient.get(`/disputes/${disputeId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.results || response.data;
  },

  async sendDisputeMessage(token: string, disputeId: string, content: string): Promise<DisputeMessage> {
    const response = await disputeClient.post(`/disputes/${disputeId}/messages`, {
      message: content
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async acceptResolution(token: string, disputeId: string): Promise<Dispute> {
    const response = await disputeClient.post(`/disputes/${disputeId}/accept`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async escalateDispute(token: string, disputeId: string): Promise<Dispute> {
    const response = await disputeClient.post(`/disputes/${disputeId}/escalate`, {
      reason: 'User requested escalation'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

// Re-export for backward compatibility
Object.assign(disputeApi, disputeApiDirect);
