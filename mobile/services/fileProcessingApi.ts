import { api } from './api';

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

export const fileProcessingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<FileProcessingStatus, { orderId: string; file: { uri: string; name: string; type: string }; onProgress?: (progress: FileUploadProgress) => void }>({
      query: ({ orderId, file }) => {
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
        return {
          url: `/orders/${orderId}/files`,
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Note: onUploadProgress is axios specific, RTK Query doesn't support it natively in the same way without a custom baseQuery.
          // For now we will rely on standard RTK Query loading states or need a custom uploader service if progress is strictly required. 
        };
      },
      invalidatesTags: ['Order'],
    }),
    getFileStatus: builder.query<FileProcessingStatus, { orderId: string; fileId: string }>({
      query: ({ orderId, fileId }) => `/orders/${orderId}/files/${fileId}/status`,
    }),
    getOrderFiles: builder.query<FileProcessingStatus[], string>({
      query: (orderId) => `/orders/${orderId}/files`,
      transformResponse: (response: { files: FileProcessingStatus[] }) => response.files,
    }),
    getOptimizationStats: builder.query<OptimizationStats, { orderId: string; fileId: string }>({
      query: ({ orderId, fileId }) => `/orders/${orderId}/files/${fileId}/optimization`,
    }),
    deleteFile: builder.mutation<void, { orderId: string; fileId: string }>({
      query: ({ orderId, fileId }) => ({
        url: `/orders/${orderId}/files/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),
    getDownloadUrl: builder.query<string, { orderId: string; fileId: string }>({
      query: ({ orderId, fileId }) => `/orders/${orderId}/files/${fileId}/download`,
      transformResponse: (response: { downloadUrl: string }) => response.downloadUrl,
    }),
  }),
});

export const {
  useUploadFileMutation,
  useGetFileStatusQuery,
  useGetOrderFilesQuery,
  useGetOptimizationStatsQuery,
  useDeleteFileMutation,
  useGetDownloadUrlQuery,
} = fileProcessingApi;

class FileProcessingHelpers {
  /**
   * Poll for file processing completion
   * Note: logic refactored to use the hook/query in component usually, but keeping helper for non-hook usage if needed (though it needs store access usually) or just utility logic.
   * This specific polling logic is better handled inside a React component with skip/pollingInterval options of useQuery.
   */

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

export const fileProcessingHelpers = new FileProcessingHelpers();
export default fileProcessingHelpers;
