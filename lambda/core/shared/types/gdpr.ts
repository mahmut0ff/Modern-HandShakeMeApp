// GDPR types and interfaces

export interface DeleteAccountRequest {
  confirmPassword: string;
  reason?: 'privacy_concerns' | 'not_using' | 'found_alternative' | 'other';
  feedback?: string;
}

export interface ExportDataRequest {
  format?: 'json' | 'csv';
  includeFiles?: boolean;
  sections?: GDPRDataSection[];
}

export type GDPRDataSection = 
  | 'profile' 
  | 'orders' 
  | 'applications' 
  | 'projects' 
  | 'reviews' 
  | 'messages' 
  | 'notifications' 
  | 'wallet' 
  | 'portfolio';

export interface GDPRDeletionRecord {
  userId: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: string;
  deletedAt: string;
  reason?: string;
  feedback?: string;
  retentionUntil: string; // 30 days from deletion
}

export interface GDPRExportData {
  exportInfo: {
    userId: string;
    exportedAt: string;
    format: string;
    requestedSections: string;
    dataRetentionPolicy: string;
  };
  profile?: any;
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
  downloadUrls?: {
    category: string;
    originalUrl: string;
    downloadUrl: string;
  }[];
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

export interface AnonymizedUserData {
  email: string;
  phone: null;
  firstName: string;
  lastName: string;
  avatar: null;
  passwordHash: string;
  telegramId: null;
  telegramUsername: null;
  isBlocked: boolean;
  isDeleted: boolean;
  deletedAt: string;
  lastLoginAt: null;
}

export interface GDPROperationResult {
  success: boolean;
  message: string;
  operationId: string;
  timestamp: string;
  affectedRecords?: number;
  errors?: string[];
}

export interface FileReference {
  url: string;
  category: 'avatar' | 'portfolio' | 'order_attachment' | 'chat_file';
  userId: string;
  relatedId?: string; // orderId, portfolioId, etc.
}