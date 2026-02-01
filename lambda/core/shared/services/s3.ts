import { S3Client, HeadObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.bucketName = process.env.S3_BUCKET || 'handshake-uploads';
  }

  async validateImageUrl(url: string): Promise<boolean> {
    try {
      // Check if URL is valid
      if (!url || !url.startsWith('http')) {
        return false;
      }

      // For S3 URLs, check if object exists
      if (url.includes(this.bucketName)) {
        const key = this.extractS3Key(url);
        if (!key) return false;

        try {
          await this.s3Client.send(new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }));
          return true;
        } catch (error) {
          return false;
        }
      }

      // For external URLs, check if accessible and is an image
      try {
        const response = await axios.head(url, { timeout: 5000 });
        const contentType = response.headers['content-type'];
        return contentType && contentType.startsWith('image/');
      } catch (error) {
        return false;
      }
    } catch (error) {
      console.error('Error validating image URL:', error);
      return false;
    }
  }
  
  async validateDocumentUrl(url: string): Promise<boolean> {
    try {
      if (!url || !url.startsWith('http')) {
        return false;
      }

      // For S3 URLs, check if object exists
      if (url.includes(this.bucketName)) {
        const key = this.extractS3Key(url);
        if (!key) return false;

        try {
          await this.s3Client.send(new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }));
          return true;
        } catch (error) {
          return false;
        }
      }

      // For external URLs, just check if accessible
      try {
        const response = await axios.head(url, { timeout: 5000 });
        return response.status === 200;
      } catch (error) {
        return false;
      }
    } catch (error) {
      console.error('Error validating document URL:', error);
      return false;
    }
  }

  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: 'public-read',
      }));

      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      if (imageUrl.includes(this.bucketName)) {
        const key = this.extractS3Key(imageUrl);
        if (key) {
          await this.deleteFile(key);
        }
      }
      // For external URLs, we can't delete them
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for image deletion failures
    }
  }

  private extractS3Key(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Handle different S3 URL formats
      if (urlObj.hostname.includes('s3.amazonaws.com')) {
        // Format: https://bucket.s3.amazonaws.com/key
        return urlObj.pathname.substring(1); // Remove leading slash
      } else if (urlObj.hostname.includes('amazonaws.com')) {
        // Format: https://s3.region.amazonaws.com/bucket/key
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 2) {
          return pathParts.slice(2).join('/'); // Remove empty string and bucket name
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}
