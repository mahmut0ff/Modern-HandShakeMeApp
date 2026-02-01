import api from './api';

export interface FileProcessingStatus {
  fileId: string;
  orderId: string;
  userId: string;
  originalName: string;
  processedUrl: string;
  thumbnailUrl?: string;
  metadata: {
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
  status: 'uploading' | 'processing' | 'optimizing' | 'processed' | 'failed';
  progress?: number;
  error?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'optimizing' | 'completed' | 'failed';
  error?: string;
}

export interface OptimizationStats {
  originalSize: number;
  optimizedSize: number;
  format: string;
  quality?: number;
  savingsPercent: number;
}

class FileProcessingApi {
  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    orderId: string,
    file: {
      uri: string;
      name: string;
      type: string;
    },
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileProcessingStatus> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await api.post<FileProcessingStatus>(
      `/orders/${orderId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              fileId: '',
              fileName: file.name,
              progress,
              status: progress < 100 ? 'uploading' : 'processing',
            });
          }
        },
      }
    );

    return response.data;
  }

  /**
   * Get file processing status
   */
  async getFileStatus(orderId: string, fileId: string): Promise<FileProcessingStatus> {
    const response = await api.get<FileProcessingStatus>(
      `/orders/${orderId}/files/${fileId}/status`
    );
    return response.data;
  }

  /**
   * Get all files for an order
   */
  async getOrderFiles(orderId: string): Promise<FileProcessingStatus[]> {
    const response = await api.get<{ files: FileProcessingStatus[] }>(
      `/orders/${orderId}/files`
    );
    return response.data.files;
  }

  /**
   * Get optimization stats for a file
   */
  async getOptimizationStats(
    orderId: string,
    fileId: string
  ): Promise<OptimizationStats> {
    const response = await api.get<OptimizationStats>(
      `/orders/${orderId}/files/${fileId}/optimization`
    );
    return response.data;
  }

  /**
   * Delete a file
   */
  async deleteFile(orderId: string, fileId: string): Promise<void> {
    await api.delete(`/orders/${orderId}/files/${fileId}`);
  }

  /**
   * Download a file
   */
  async downloadFile(orderId: string, fileId: string): Promise<string> {
    const response = await api.get<{ downloadUrl: string }>(
      `/orders/${orderId}/files/${fileId}/download`
    );
    return response.data.downloadUrl;
  }

  /**
   * Poll for file processing completion
   */
  async pollFileProcessing(
    orderId: string,
    fileId: string,
    onStatusUpdate?: (status: FileProcessingStatus) => void,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<FileProcessingStatus> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getFileStatus(orderId, fileId);
          
          if (onStatusUpdate) {
            onStatusUpdate(status);
          }

          if (status.status === 'processed') {
            resolve(status);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error(status.error || 'File processing failed'));
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('File processing timeout'));
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Get file preview URL (thumbnail or original)
   */
  getPreviewUrl(file: FileProcessingStatus): string {
    return file.thumbnailUrl || file.processedUrl;
  }

  /**
   * Check if file is an image
   */
  isImage(file: FileProcessingStatus): boolean {
    return file.metadata.type.startsWith('image/');
  }

  /**
   * Check if file is a video
   */
  isVideo(file: FileProcessingStatus): boolean {
    return file.metadata.type.startsWith('video/');
  }

  /**
   * Check if file is a document
   */
  isDocument(file: FileProcessingStatus): boolean {
    return (
      file.metadata.type.startsWith('application/') ||
      file.metadata.type.startsWith('text/')
    );
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

export default new FileProcessingApi();
