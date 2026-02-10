// File storage utility for secure file uploads

import * as fs from 'fs';
import * as path from 'path';

const isLocalDev = process.env.NODE_ENV === 'development' || !process.env.S3_BUCKET_NAME;
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'handshake-uploads';
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

let s3Client: any = null;

if (!isLocalDev) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
  });
}

/**
 * Upload file to storage (S3 in production, local filesystem in development)
 * @param fileBuffer - File content as Buffer
 * @param filePath - Relative path within storage (e.g., 'verification/userId/filename.jpg')
 * @param contentType - MIME type of the file
 * @returns URL to access the file
 */
export async function uploadToStorage(
  fileBuffer: Buffer,
  filePath: string,
  contentType: string
): Promise<string> {
  if (isLocalDev) {
    // Local development: save to filesystem
    const fullPath = path.join(UPLOAD_PATH, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, fileBuffer);
    
    // Return local URL
    return `/uploads/${filePath}`;
  } else {
    // Production: upload to S3
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
      // Make files private by default
      ACL: 'private',
    }));
    
    // Return S3 URL (note: this will require signed URLs for access)
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filePath}`;
  }
}

/**
 * Delete file from storage
 * @param filePath - Relative path within storage
 */
export async function deleteFromStorage(filePath: string): Promise<void> {
  if (isLocalDev) {
    const fullPath = path.join(UPLOAD_PATH, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } else {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    }));
  }
}

/**
 * Generate signed URL for secure file access (production only)
 * @param filePath - Relative path within storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  if (isLocalDev) {
    // In development, return direct URL
    return `/uploads/${filePath}`;
  } else {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  }
}
