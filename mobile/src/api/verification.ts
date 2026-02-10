import apiClient from './client';

export interface VerificationDocument {
  id: string;
  type: 'face_photo' | 'passport_photo' | 'passport' | 'id_card' | 'driver_license' | 'certificate' | 'diploma' | 'other';
  url: string;
  file_name: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface VerificationStatus {
  id: string;
  status: 'not_started' | 'pending' | 'in_review' | 'approved' | 'rejected';
  documents: VerificationDocument[];
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadPhotoResponse {
  message: string;
  photo: {
    id: string;
    type: string;
    url: string;
    uploaded_at: string;
  };
  verification_status: string;
}

export interface SubmitVerificationResponse {
  message: string;
  verification: {
    id: string;
    status: string;
    priority: string;
    documentsCount: number;
    estimatedReviewTime: string;
  };
  nextSteps: string[];
}

export const verificationApi = {
  getStatus: () =>
    apiClient.get<VerificationStatus>('/verification/status'),

  uploadFacePhoto: (file: FormData) =>
    apiClient.post<UploadPhotoResponse>('/verification/upload-face-photo', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  uploadPassportPhoto: (file: FormData) =>
    apiClient.post<UploadPhotoResponse>('/verification/upload-passport-photo', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  submitForReview: (data?: { additionalInfo?: string; urgentReview?: boolean }) =>
    apiClient.post<SubmitVerificationResponse>('/verification/submit', data || {}),

  // Admin endpoints
  adminListPending: () =>
    apiClient.get<{ results: any[]; count: number }>('/verification/admin/pending'),

  adminApprove: (verificationId: string, notes?: string) =>
    apiClient.post('/verification/admin/approve', { verificationId, notes }),

  adminReject: (verificationId: string, rejectionReason: string, notes?: string) =>
    apiClient.post('/verification/admin/reject', { verificationId, rejectionReason, notes }),
};
