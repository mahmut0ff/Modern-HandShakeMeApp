import { api } from './api';

export interface BackgroundCheck {
  id: string;
  checkType: 'IDENTITY' | 'CRIMINAL' | 'EMPLOYMENT' | 'EDUCATION' | 'COMPREHENSIVE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  progress: number;
  pricing: {
    baseAmount: number;
    processingFee: number;
    total: number;
  };
  createdAt: string;
  submittedAt?: string;
  completedAt?: string;
  estimatedCompletionDate: string;
  lastUpdated?: string;
  failureReason?: string;
  badges: Array<{
    type: string;
    earnedAt: string;
    expiresAt: string;
  }>;
  resultDetails?: any;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface BackgroundCheckDispute {
  id: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'FAILED';
  disputeType: 'INCORRECT_INFORMATION' | 'IDENTITY_THEFT' | 'OUTDATED_RECORDS' | 'PROCESSING_ERROR' | 'OTHER';
  createdAt: string;
  estimatedResolutionDate: string;
  caseNumber: string;
}

export interface InitiateCheckRequest {
  checkType: 'IDENTITY' | 'CRIMINAL' | 'EMPLOYMENT' | 'EDUCATION' | 'COMPREHENSIVE';
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    ssn?: string;
    nationalId?: string;
    passportNumber?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  previousAddresses?: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fromDate: string;
    toDate: string;
  }>;
  employmentHistory?: Array<{
    employer: string;
    position: string;
    startDate: string;
    endDate?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
    };
  }>;
  educationHistory?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationDate: string;
    gpa?: number;
  }>;
  references?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    yearsKnown: number;
  }>;
  consentAgreement: boolean;
  consentDate: string;
}

export interface DisputeRequest {
  checkId: string;
  disputeType: 'INCORRECT_INFORMATION' | 'IDENTITY_THEFT' | 'OUTDATED_RECORDS' | 'PROCESSING_ERROR' | 'OTHER';
  disputedItems: Array<{
    category: 'PERSONAL_INFO' | 'CRIMINAL_HISTORY' | 'EMPLOYMENT' | 'EDUCATION' | 'REFERENCES';
    field: string;
    currentValue: string;
    correctValue: string;
    explanation: string;
  }>;
  description: string;
  supportingDocuments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: 'PDF' | 'IMAGE' | 'DOCUMENT';
    description?: string;
  }>;
  contactPreference?: 'EMAIL' | 'PHONE' | 'MAIL';
  urgentRequest?: boolean;
}

export interface VerificationBadge {
  type: string;
  name: string;
  description: string;
  earnedAt: string;
  expiresAt?: string;
  isActive: boolean;
  verificationLevel: 'BASIC' | 'STANDARD' | 'PREMIUM';
}

export const backgroundCheckApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Initiate background check
    initiateBackgroundCheck: builder.mutation<{
      backgroundCheck: BackgroundCheck;
      message: string;
      nextSteps: string[];
    }, InitiateCheckRequest>({
      query: (data) => ({
        url: '/background-checks/initiate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BackgroundCheck', 'Verification'],
    }),

    // Get background check status
    getBackgroundCheckStatus: builder.query<{
      backgroundCheck: BackgroundCheck | null;
      nextSteps: string[];
      message: string;
      recommendations?: string[];
    }, { checkId?: string }>({
      query: ({ checkId }) => ({
        url: '/background-checks/status',
        params: checkId ? { checkId } : {},
      }),
      providesTags: (result, error, { checkId }) => [
        'BackgroundCheck',
        ...(checkId ? [{ type: 'BackgroundCheck' as const, id: checkId }] : []),
      ],
    }),

    // Get all background checks for user
    getBackgroundCheckHistory: builder.query<{
      checks: BackgroundCheck[];
      totalCount: number;
    }, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => ({
        url: '/background-checks/history',
        params: { page, limit },
      }),
      providesTags: ['BackgroundCheck'],
    }),

    // Dispute background check results
    disputeBackgroundCheck: builder.mutation<{
      dispute: BackgroundCheckDispute;
      message: string;
      nextSteps: string[];
      supportInfo: {
        caseNumber: string;
        contactMethods: string[];
      };
    }, DisputeRequest>({
      query: (data) => ({
        url: '/background-checks/dispute',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BackgroundCheck'],
    }),

    // Get dispute status
    getDisputeStatus: builder.query<{
      dispute: BackgroundCheckDispute;
      timeline: Array<{
        action: string;
        description: string;
        performedAt: string;
        performedBy: string;
        details?: any;
      }>;
    }, string>({
      query: (disputeId) => ({
        url: `/background-checks/disputes/${disputeId}`,
      }),
      providesTags: (result, error, disputeId) => [
        { type: 'BackgroundCheck', id: `dispute-${disputeId}` },
      ],
    }),

    // Get verification badges
    getVerificationBadges: builder.query<{
      badges: VerificationBadge[];
      totalBadges: number;
      verificationScore: number;
      nextRecommendedCheck?: string;
    }, void>({
      query: () => ({
        url: '/background-checks/badges',
      }),
      providesTags: ['Verification'],
    }),

    // Get background check pricing
    getBackgroundCheckPricing: builder.query<{
      pricing: Record<string, {
        baseAmount: number;
        processingFee: number;
        total: number;
        estimatedDays: number;
        description: string;
        features: string[];
      }>;
      discounts: Array<{
        type: string;
        description: string;
        discount: number;
        conditions: string[];
      }>;
    }, void>({
      query: () => ({
        url: '/background-checks/pricing',
      }),
      providesTags: ['BackgroundCheck'],
    }),

    // Cancel background check
    cancelBackgroundCheck: builder.mutation<{
      message: string;
      refundAmount?: number;
    }, { checkId: string; reason?: string }>({
      query: ({ checkId, reason }) => ({
        url: `/background-checks/${checkId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['BackgroundCheck'],
    }),

    // Upload supporting documents
    uploadSupportingDocument: builder.mutation<{
      fileUrl: string;
      fileName: string;
      fileType: string;
    }, {
      checkId: string;
      file: FormData;
      documentType: string;
      description?: string;
    }>({
      query: ({ checkId, file, documentType, description }) => ({
        url: `/background-checks/${checkId}/documents`,
        method: 'POST',
        body: file,
        formData: true,
        params: { documentType, description },
      }),
      invalidatesTags: ['BackgroundCheck'],
    }),

    // Get background check requirements by type
    getCheckRequirements: builder.query<{
      requirements: {
        requiredFields: string[];
        optionalFields: string[];
        supportingDocuments: Array<{
          type: string;
          description: string;
          required: boolean;
          acceptedFormats: string[];
        }>;
        estimatedTime: string;
        pricing: {
          baseAmount: number;
          processingFee: number;
          total: number;
        };
      };
    }, { checkType: string }>({
      query: ({ checkType }) => ({
        url: '/background-checks/requirements',
        params: { checkType },
      }),
      providesTags: ['BackgroundCheck'],
    }),
  }),
});

export const {
  useInitiateBackgroundCheckMutation,
  useGetBackgroundCheckStatusQuery,
  useGetBackgroundCheckHistoryQuery,
  useDisputeBackgroundCheckMutation,
  useGetDisputeStatusQuery,
  useGetVerificationBadgesQuery,
  useGetBackgroundCheckPricingQuery,
  useCancelBackgroundCheckMutation,
  useUploadSupportingDocumentMutation,
  useGetCheckRequirementsQuery,
} = backgroundCheckApi;