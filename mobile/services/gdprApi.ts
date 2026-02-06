import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance for GDPR operations
const gdprClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 60000, // 60 seconds for large exports
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
gdprClient.interceptors.request.use(
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
  (error: any) => {
    return Promise.reject(error);
  }
);

export interface GDPRExportData {
  exportInfo: {
    userId: string;
    exportedAt: string;
    format: 'json' | 'csv';
    requestedSections: string;
    dataRetentionPolicy: string;
  };
  profile?: {
    user: {
      id: string;
      email: string;
      phone?: string;
      firstName: string;
      lastName: string;
      role: string;
      avatar?: string;
      isPhoneVerified?: boolean;
      createdAt: string;
      lastLoginAt?: string;
      telegramId?: string;
      telegramUsername?: string;
    };
  };
  orders?: any[];
  applications?: any[];
  projects?: any[];
  reviews?: {
    given: any[];
    received: any[];
  };
  messages?: any[];
  notifications?: any[];
  wallet?: {
    balance: number;
    currency: string;
    transactions: any[];
    paymentMethods: any[];
  };
  portfolio?: any[];
  files?: {
    avatar?: string;
    portfolioImages: string[];
    orderAttachments: string[];
  };
  downloadUrls?: Array<{
    category: string;
    originalUrl: string;
    downloadUrl: string;
  }>;
  summary: {
    totalOrders: number;
    totalApplications: number;
    totalProjects: number;
    totalReviews: number;
    totalMessages: number;
    totalNotifications: number;
    totalTransactions: number;
    totalPortfolioItems: number;
  };
}

export interface GDPROperationResult {
  success: boolean;
  message: string;
  operationId: string;
  timestamp: string;
  affectedRecords?: number;
  errors?: string[];
}

export type ExportSection =
  | 'profile'
  | 'orders'
  | 'applications'
  | 'projects'
  | 'reviews'
  | 'messages'
  | 'notifications'
  | 'wallet'
  | 'portfolio';

export type DeleteReason =
  | 'privacy_concerns'
  | 'not_using'
  | 'found_alternative'
  | 'other';

export interface ExportDataRequest {
  format?: 'json' | 'csv';
  includeFiles?: boolean;
  sections?: ExportSection[];
}

export interface DeleteAccountRequest {
  confirmPassword: string;
  reason?: DeleteReason;
  feedback?: string;
}

export interface ConsentSettings {
  marketing: boolean;
  analytics: boolean;
  personalization: boolean;
  thirdParty: boolean;
  updatedAt?: string;
}

// Export user data
export const exportUserData = async (
  request: ExportDataRequest = {}
): Promise<GDPRExportData> => {
  const params = new URLSearchParams();

  if (request.format) {
    params.append('format', request.format);
  }

  if (request.includeFiles !== undefined) {
    params.append('includeFiles', String(request.includeFiles));
  }

  if (request.sections && request.sections.length > 0) {
    params.append('sections', request.sections.join(','));
  }

  const response = await gdprClient.get(`/gdpr/export?${params.toString()}`);
  return response.data;
};

// Delete user account
export const deleteUserAccount = async (
  request: DeleteAccountRequest
): Promise<GDPROperationResult> => {
  const response = await gdprClient.delete('/gdpr/account', {
    data: request,
  });
  return response.data;
};

// Get consent settings
export const getConsentSettings = async (): Promise<ConsentSettings> => {
  try {
    const stored = await AsyncStorage.getItem('gdpr_consents');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get consent settings:', error);
  }

  // Default consents
  return {
    marketing: false,
    analytics: true,
    personalization: true,
    thirdParty: false,
  };
};

// Update consent settings
export const updateConsentSettings = async (
  consents: ConsentSettings
): Promise<void> => {
  const updated = {
    ...consents,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem('gdpr_consents', JSON.stringify(updated));

  // Optionally sync with backend
  try {
    await gdprClient.post('/gdpr/consents', updated);
  } catch (error) {
    console.error('Failed to sync consent settings:', error);
  }
};

// Check if user can delete account
export const checkDeletionEligibility = async (): Promise<{
  canDelete: boolean;
  reasons: string[];
}> => {
  try {
    const response = await gdprClient.get('/gdpr/deletion-eligibility');
    return response.data;
  } catch (error: any) {
    // If endpoint doesn't exist, return default
    return {
      canDelete: true,
      reasons: [],
    };
  }
};

// Download exported data as file
export const downloadExportedData = async (
  data: GDPRExportData,
  format: 'json' | 'csv' = 'json'
): Promise<string> => {
  const filename = `handshakeme_data_export_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'json') {
    const jsonString = JSON.stringify(data, null, 2);
    return jsonString;
  } else {
    // Convert to CSV (simplified)
    const csv = convertToCSV(data);
    return csv;
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data: GDPRExportData): string => {
  const lines: string[] = [];

  // Add summary
  lines.push('Summary');
  lines.push('Category,Count');
  Object.entries(data.summary).forEach(([key, value]) => {
    lines.push(`${key},${value}`);
  });
  lines.push('');

  // Add profile
  if (data.profile) {
    lines.push('Profile');
    lines.push('Field,Value');
    Object.entries(data.profile.user).forEach(([key, value]) => {
      lines.push(`${key},"${value}"`);
    });
    lines.push('');
  }

  return lines.join('\n');
};

export const gdprApi = {
  exportUserData,
  deleteUserAccount,
  getConsentSettings,
  updateConsentSettings,
  checkDeletionEligibility,
  downloadExportedData,
};
