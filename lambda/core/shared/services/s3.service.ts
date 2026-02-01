// S3 Service for file operations

import AWS from 'aws-sdk';
import { logger } from '../utils/logger';
import { FileReference } from '../types/gdpr';

export class S3Service {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = new AWS.S3();
    this.bucketName = process.env.AWS_S3_BUCKET!;
    
    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);
      if (!key) {
        logger.warn('Could not extract S3 key from URL', { fileUrl });
        return false;
      }

      // Check if file exists first
      const exists = await this.fileExists(key);
      if (!exists) {
        logger.info('File does not exist, skipping deletion', { key });
        return true;
      }

      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      logger.info('File deleted from S3', { key });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete file from S3', { fileUrl, error: error.message });
      return false;
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteFiles(fileReferences: FileReference[]): Promise<{
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      deleted: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const fileRef of fileReferences) {
      try {
        const success = await this.deleteFile(fileRef.url);
        if (success) {
          result.deleted++;
        } else {
          result.failed++;
          result.errors.push(`Failed to delete ${fileRef.url}`);
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Error deleting ${fileRef.url}: ${error.message}`);
      }
    }

    logger.info('Bulk file deletion completed', result);
    return result;
  }

  /**
   * Generate signed URL for file download
   */
  async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);
      if (!key) {
        logger.warn('Could not extract S3 key from URL', { fileUrl });
        return null;
      }

      const signedUrl = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      });

      return signedUrl;
    } catch (error: any) {
      logger.error('Failed to generate signed URL', { fileUrl, error: error.message });
      return null;
    }
  }

  /**
   * Generate signed URLs for multiple files
   */
  async getSignedUrls(fileReferences: FileReference[], expiresIn: number = 3600): Promise<{
    category: string;
    originalUrl: string;
    downloadUrl: string | null;
  }[]> {
    const results = [];

    for (const fileRef of fileReferences) {
      const signedUrl = await this.getSignedUrl(fileRef.url, expiresIn);
      results.push({
        category: fileRef.category,
        originalUrl: fileRef.url,
        downloadUrl: signedUrl
      });
    }

    return results;
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Extract S3 key from full URL
   */
  private extractKeyFromUrl(fileUrl: string): string | null {
    try {
      // Handle different URL formats:
      // https://bucket.s3.amazonaws.com/key
      // https://s3.amazonaws.com/bucket/key
      // https://bucket.s3.region.amazonaws.com/key
      
      const url = new URL(fileUrl);
      
      // Format: https://bucket.s3.amazonaws.com/key or https://bucket.s3.region.amazonaws.com/key
      if (url.hostname.includes('.s3.') || url.hostname.includes('.s3-')) {
        return url.pathname.substring(1); // Remove leading slash
      }
      
      // Format: https://s3.amazonaws.com/bucket/key
      if (url.hostname === 's3.amazonaws.com') {
        const pathParts = url.pathname.split('/');
        if (pathParts.length >= 3) {
          return pathParts.slice(2).join('/'); // Remove empty string and bucket name
        }
      }
      
      return null;
    } catch (error) {
      logger.warn('Invalid URL format', { fileUrl });
      return null;
    }
  }

  /**
   * List files by prefix (for finding user files)
   */
  async listFilesByPrefix(prefix: string): Promise<string[]> {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: prefix
      }).promise();

      return result.Contents?.map(obj => obj.Key!).filter(key => key) || [];
    } catch (error: any) {
      logger.error('Failed to list files by prefix', { prefix, error: error.message });
      return [];
    }
  }

  /**
   * Delete all files with a specific prefix (for user cleanup)
   */
  async deleteFilesByPrefix(prefix: string): Promise<{
    deleted: number;
    failed: number;
  }> {
    try {
      const keys = await this.listFilesByPrefix(prefix);
      
      if (keys.length === 0) {
        return { deleted: 0, failed: 0 };
      }

      // Delete in batches of 1000 (S3 limit)
      const batchSize = 1000;
      let deleted = 0;
      let failed = 0;

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        
        try {
          await this.s3.deleteObjects({
            Bucket: this.bucketName,
            Delete: {
              Objects: batch.map(key => ({ Key: key }))
            }
          }).promise();
          
          deleted += batch.length;
        } catch (error: any) {
          logger.error('Failed to delete batch of files', { batch, error: error.message });
          failed += batch.length;
        }
      }

      logger.info('Bulk deletion by prefix completed', { prefix, deleted, failed });
      return { deleted, failed };
    } catch (error: any) {
      logger.error('Failed to delete files by prefix', { prefix, error: error.message });
      return { deleted: 0, failed: keys.length || 0 };
    }
  }
}