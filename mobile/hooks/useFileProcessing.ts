import { useState, useCallback, useRef } from 'react';
import fileProcessingApi, {
  FileProcessingStatus,
  FileUploadProgress,
  OptimizationStats,
} from '../services/fileProcessingApi';

interface UseFileProcessingOptions {
  orderId: string;
  onUploadComplete?: (file: FileProcessingStatus) => void;
  onUploadError?: (error: Error) => void;
}

export const useFileProcessing = ({
  orderId,
  onUploadComplete,
  onUploadError,
}: UseFileProcessingOptions) => {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, FileUploadProgress>>(
    new Map()
  );
  const [processedFiles, setProcessedFiles] = useState<FileProcessingStatus[]>([]);
  const [optimizationStats, setOptimizationStats] = useState<Map<string, OptimizationStats>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  /**
   * Upload a file
   */
  const uploadFile = useCallback(
    async (file: { uri: string; name: string; type: string }) => {
      const tempFileId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Add to uploading files
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.set(tempFileId, {
            fileId: tempFileId,
            fileName: file.name,
            progress: 0,
            status: 'uploading',
          });
          return newMap;
        });

        // Upload file
        const result = await fileProcessingApi.uploadFile(
          orderId,
          file,
          (progress) => {
            setUploadingFiles((prev) => {
              const newMap = new Map(prev);
              newMap.set(tempFileId, progress);
              return newMap;
            });
          }
        );

        // Remove from uploading, add to processed
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempFileId);
          return newMap;
        });

        // Poll for processing completion
        const finalStatus = await fileProcessingApi.pollFileProcessing(
          orderId,
          result.fileId,
          (status) => {
            setUploadingFiles((prev) => {
              const newMap = new Map(prev);
              newMap.set(result.fileId, {
                fileId: result.fileId,
                fileName: file.name,
                progress: 100,
                status: status.status as any,
              });
              return newMap;
            });
          }
        );

        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(result.fileId);
          return newMap;
        });

        setProcessedFiles((prev) => [...prev, finalStatus]);

        // Load optimization stats
        if (fileProcessingApi.isImage(finalStatus)) {
          loadOptimizationStats(finalStatus.fileId);
        }

        onUploadComplete?.(finalStatus);
        return finalStatus;
      } catch (err: any) {
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(tempFileId);
          if (current) {
            newMap.set(tempFileId, {
              ...current,
              status: 'failed',
              error: err.message,
            });
          }
          return newMap;
        });

        setError(err.message);
        onUploadError?.(err);
        throw err;
      }
    },
    [orderId, onUploadComplete, onUploadError]
  );

  /**
   * Load files for the order
   */
  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const files = await fileProcessingApi.getOrderFiles(orderId);
      setProcessedFiles(files);

      // Load optimization stats for images
      for (const file of files) {
        if (fileProcessingApi.isImage(file)) {
          loadOptimizationStats(file.fileId);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Load optimization stats for a file
   */
  const loadOptimizationStats = useCallback(
    async (fileId: string) => {
      try {
        const stats = await fileProcessingApi.getOptimizationStats(orderId, fileId);
        setOptimizationStats((prev) => {
          const newMap = new Map(prev);
          newMap.set(fileId, stats);
          return newMap;
        });
      } catch (err) {
        console.error('Failed to load optimization stats:', err);
      }
    },
    [orderId]
  );

  /**
   * Delete a file
   */
  const deleteFile = useCallback(
    async (fileId: string) => {
      try {
        await fileProcessingApi.deleteFile(orderId, fileId);
        setProcessedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
        setOptimizationStats((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [orderId]
  );

  /**
   * Download a file
   */
  const downloadFile = useCallback(
    async (fileId: string) => {
      try {
        const downloadUrl = await fileProcessingApi.downloadFile(orderId, fileId);
        return downloadUrl;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [orderId]
  );

  /**
   * Cancel file upload
   */
  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(fileId);
    }

    setUploadingFiles((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, []);

  /**
   * Get file by ID
   */
  const getFile = useCallback(
    (fileId: string) => {
      return processedFiles.find((f) => f.fileId === fileId);
    },
    [processedFiles]
  );

  /**
   * Get optimization stats for a file
   */
  const getOptimizationStats = useCallback(
    (fileId: string) => {
      return optimizationStats.get(fileId);
    },
    [optimizationStats]
  );

  return {
    uploadFile,
    loadFiles,
    deleteFile,
    downloadFile,
    cancelUpload,
    getFile,
    getOptimizationStats,
    uploadingFiles: Array.from(uploadingFiles.values()),
    processedFiles,
    loading,
    error,
  };
};
