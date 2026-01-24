/**
 * Verification Helper Functions
 * Utilities for verification status and document management
 */

export interface DocumentType {
  type: string;
  label: string;
  icon: string;
  description: string;
  required: boolean;
}

/**
 * Get document type configuration
 */
export const getDocumentTypeConfig = (type: string): DocumentType | undefined => {
  const types: Record<string, DocumentType> = {
    identity: {
      type: 'identity',
      label: 'Identity Document',
      icon: 'card',
      description: 'Passport, ID card, or driver\'s license',
      required: true,
    },
    selfie: {
      type: 'selfie',
      label: 'Selfie with ID',
      icon: 'person',
      description: 'Photo of you holding your ID',
      required: true,
    },
    address: {
      type: 'address',
      label: 'Proof of Address',
      icon: 'home',
      description: 'Utility bill or bank statement',
      required: false,
    },
    education: {
      type: 'education',
      label: 'Education Certificate',
      icon: 'school',
      description: 'Diploma or degree certificate',
      required: false,
    },
    experience: {
      type: 'experience',
      label: 'Work Experience',
      icon: 'briefcase',
      description: 'Previous work certificates',
      required: false,
    },
    tools: {
      type: 'tools',
      label: 'Professional Tools',
      icon: 'construct',
      description: 'Photos of your professional equipment',
      required: false,
    },
    license: {
      type: 'license',
      label: 'Professional License',
      icon: 'ribbon',
      description: 'Trade or professional license',
      required: false,
    },
    insurance: {
      type: 'insurance',
      label: 'Insurance Certificate',
      icon: 'shield',
      description: 'Liability insurance document',
      required: false,
    },
  };

  return types[type];
};

/**
 * Get all document types
 */
export const getAllDocumentTypes = (): DocumentType[] => {
  return [
    'identity',
    'selfie',
    'address',
    'education',
    'experience',
    'tools',
    'license',
    'insurance',
  ].map(type => getDocumentTypeConfig(type)!).filter(Boolean);
};

/**
 * Get required document types
 */
export const getRequiredDocumentTypes = (): DocumentType[] => {
  return getAllDocumentTypes().filter(type => type.required);
};

/**
 * Calculate verification completion percentage
 */
export const calculateCompletionPercentage = (
  completed: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Check if verification is complete
 */
export const isVerificationComplete = (
  approvedCount: number,
  requiredCount: number
): boolean => {
  return approvedCount >= requiredCount;
};

/**
 * Get verification level based on approved documents
 */
export const getVerificationLevel = (
  approvedCount: number
): 'basic' | 'standard' | 'premium' => {
  if (approvedCount >= 6) return 'premium';
  if (approvedCount >= 3) return 'standard';
  return 'basic';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file size
 */
export const validateFileSize = (
  bytes: number,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } => {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (bytes > maxBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

/**
 * Validate file type
 */
export const validateFileType = (
  mimeType: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf']
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: JPG, PNG, PDF',
    };
  }

  return { valid: true };
};

/**
 * Get status color
 */
export const getStatusColor = (
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
): string => {
  switch (status) {
    case 'approved':
      return '#10B981'; // green
    case 'in_review':
      return '#F59E0B'; // orange
    case 'rejected':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
};

/**
 * Get status label
 */
export const getStatusLabel = (
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
): string => {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'in_review':
      return 'Under Review';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Pending';
  }
};

/**
 * Get overall status label
 */
export const getOverallStatusLabel = (
  status: 'unverified' | 'partial' | 'in_review' | 'verified' | 'rejected'
): string => {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'in_review':
      return 'Under Review';
    case 'rejected':
      return 'Verification Failed';
    case 'partial':
      return 'Partially Verified';
    default:
      return 'Not Verified';
  }
};

/**
 * Sort documents by priority (required first, then by status)
 */
export const sortDocumentsByPriority = <T extends { required: boolean; status: string }>(
  documents: T[]
): T[] => {
  return [...documents].sort((a, b) => {
    // Required documents first
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;

    // Then by status priority
    const statusPriority = {
      rejected: 0,
      pending: 1,
      in_review: 2,
      approved: 3,
    };

    const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 1;
    const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 1;

    return aPriority - bPriority;
  });
};
