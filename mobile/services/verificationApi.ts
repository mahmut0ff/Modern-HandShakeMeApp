import { api } from './api';

export interface VerificationDocument {
  id: number;
  user: number;
  document_type: 
    | 'identity'
    | 'selfie'
    | 'address'
    | 'education'
    | 'experience'
    | 'tools'
    | 'license'
    | 'insurance';
  title: string;
  description?: string;
  file_url?: string;
  thumbnail_url?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  rejection_reason?: string;
  is_required: boolean;
  uploaded_at: string;
  reviewed_at?: string;
  expires_at?: string;
}

export interface VerificationStatus {
  user: number;
  overall_status: 'unverified' | 'partial' | 'in_review' | 'verified' | 'rejected';
  identity_verified: boolean;
  address_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  documents_count: number;
  approved_documents_count: number;
  pending_documents_count: number;
  verification_level: 'basic' | 'standard' | 'premium';
  verified_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface DocumentUploadData {
  document_type: string;
  title: string;
  description?: string;
  file: FormData;
}

export interface DocumentUpdateData {
  title?: string;
  description?: string;
  file?: FormData;
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
    }),

    // Documents
    getVerificationDocuments: builder.query<VerificationDocument[], void>({
      query: () => '/verification/documents',
      providesTags: ['Verification'],
    }),

    getVerificationDocument: builder.query<VerificationDocument, number>({
      query: (id) => `/verification/documents/${id}`,
      providesTags: ['Verification'],
    }),

    uploadVerificationDocument: builder.mutation<VerificationDocument, DocumentUploadData>({
      query: (data) => ({
        url: '/verification/documents',
        method: 'POST',
        body: data.file,
        formData: true,
      }),
      invalidatesTags: ['Verification'],
    }),

    updateVerificationDocument: builder.mutation<VerificationDocument, { id: number; data: DocumentUpdateData }>({
      query: ({ id, data }) => ({
        url: `/verification/documents/${id}`,
        method: 'PATCH',
        body: data.file || data,
        formData: !!data.file,
      }),
      invalidatesTags: ['Verification'],
    }),

    deleteVerificationDocument: builder.mutation<void, number>({
      query: (id) => ({
        url: `/verification/documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Verification'],
    }),

    // Submit for review
    submitForReview: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/verification/submit',
        method: 'POST',
      }),
      invalidatesTags: ['Verification'],
    }),

    // Requirements
    getVerificationRequirements: builder.query<VerificationRequirement[], void>({
      query: () => '/verification/requirements',
    }),

    // Resubmit rejected document
    resubmitDocument: builder.mutation<VerificationDocument, { id: number; file: FormData }>({
      query: ({ id, file }) => ({
        url: `/verification/documents/${id}/resubmit`,
        method: 'POST',
        body: file,
        formData: true,
      }),
      invalidatesTags: ['Verification'],
    }),

    // Request verification review
    requestReview: builder.mutation<{ message: string }, { document_ids?: number[] }>({
      query: (data) => ({
        url: '/verification/request-review',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Verification'],
    }),
  }),
});

export const {
  useGetVerificationStatusQuery,
  useGetVerificationDocumentsQuery,
  useGetVerificationDocumentQuery,
  useUploadVerificationDocumentMutation,
  useUpdateVerificationDocumentMutation,
  useDeleteVerificationDocumentMutation,
  useSubmitForReviewMutation,
  useGetVerificationRequirementsQuery,
  useResubmitDocumentMutation,
  useRequestReviewMutation,
} = verificationApi;