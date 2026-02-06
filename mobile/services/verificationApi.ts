import { api } from './api';

export interface VerificationDocument {
  id: string;
  type: 'passport' | 'id_card' | 'driver_license' | 'certificate' | 'diploma' | 'other';
  url: string;
  file_name: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface VerificationStatus {
  id: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'suspended';
  documents: VerificationDocument[];
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for UI compatibility
  overall_status: 'unverified' | 'partial' | 'in_review' | 'verified' | 'rejected';
  identity_verified: boolean;
}

export interface VerificationRequirement {
  document_type: string;
  title: string;
  description: string;
  is_required: boolean;
  icon: string;
  examples?: string[];
  max_file_size?: number;
  allowed_formats?: string[];
}

export const verificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Verification status
    getVerificationStatus: builder.query<VerificationStatus, void>({
      query: () => '/verification/status',
      providesTags: ['Verification'],
      transformResponse: (response: any) => {
        // Map backend status to UI-friendly format
        const statusMap: Record<string, string> = {
          'pending': 'unverified',
          'in_review': 'in_review',
          'approved': 'verified',
          'rejected': 'rejected',
          'suspended': 'rejected',
        };
        return {
          ...response,
          overall_status: statusMap[response.status] || 'unverified',
          identity_verified: response.status === 'approved',
        };
      },
    }),

    // Requirements
    getVerificationRequirements: builder.query<VerificationRequirement[], void>({
      query: () => '/verification/requirements',
    }),

    // Upload document
    uploadVerificationDocument: builder.mutation<any, { documentType: string; file: FormData }>({
      query: ({ documentType, file }) => ({
        url: `/verification/documents?document_type=${documentType}`,
        method: 'POST',
        body: file,
        formData: true,
      }),
      invalidatesTags: ['Verification'],
    }),

    // Submit for review
    submitForReview: builder.mutation<{ message: string }, { additionalInfo?: string; urgentReview?: boolean } | void>({
      query: (data) => ({
        url: '/verification/submit',
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: ['Verification'],
    }),
  }),
});

export const {
  useGetVerificationStatusQuery,
  useGetVerificationRequirementsQuery,
  useUploadVerificationDocumentMutation,
  useSubmitForReviewMutation,
} = verificationApi;