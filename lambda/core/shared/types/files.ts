// File processing types

export interface FileProcessingResult {
  fileId: string;
  originalName: string;
  processedUrl: string;
  thumbnailUrl?: string;
  metadata: FileMetadata;
  status: 'processed' | 'failed';
  error?: string;
}

export interface FileMetadata {
  size: number;
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for videos in seconds
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
  contentType?: string;
}

export interface PathValidationResult {
  isValid: boolean;
  reason?: string;
  userId?: string;
  orderId?: string;
  filename?: string;
}

export interface VirusScanResult {
  clean: boolean;
  threat?: string;
}

export interface FileProcessingConfig {
  maxFileSize: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedDocumentTypes: string[];
  thumbnailSize: {
    width: number;
    height: number;
  };
}

export interface FileRecord {
  PK: string; // ORDER#${orderId}
  SK: string; // FILE#${fileId}
  GSI1PK: string; // USER#${userId}
  GSI1SK: string; // FILE#${fileId}
  
  fileId: string;
  orderId: string;
  userId: string;
  originalName: string;
  processedUrl: string;
  thumbnailUrl?: string;
  metadata: FileMetadata;
  
  status: 'processed' | 'failed';
  processedAt: string;
  createdAt: string;
  updatedAt: string;
  
  type: 'file';
  version: number;
}

export interface ErrorRecord {
  PK: string; // ORDER#${orderId}
  SK: string; // ERROR#${errorId}
  GSI1PK: string; // USER#${userId}
  GSI1SK: string; // ERROR#${errorId}
  
  errorId: string;
  orderId: string;
  userId: string;
  filename: string;
  errorMessage: string;
  errorType: 'FILE_PROCESSING_ERROR';
  
  status: 'failed';
  createdAt: string;
  type: 'error';
}

export interface NotificationMessage {
  userId: string;
  type: 'FILE_PROCESSED' | 'FILE_PROCESSING_ERROR';
  title: string;
  body: string;
  data: {
    orderId: string;
    fileId?: string;
    filename?: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    fileSize?: number;
    fileType?: string;
    error?: string;
  };
  timestamp: string;
}

export interface SystemAlert {
  service: string;
  error: string;
  stack?: string;
  s3Key: string;
  timestamp: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}