// Upload verification documents Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, badRequest, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { VerificationRepository } from '../shared/repositories/verification.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// S3 client - only used in production
let s3Client: any = null;
const isLocalDev = process.env.NODE_ENV === 'development' || !process.env.S3_BUCKET_NAME;

if (!isLocalDev) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
  });
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'handshake-uploads';
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

const uploadDocumentsSchema = z.object({
  document_type: z.enum(['PASSPORT', 'ID_CARD', 'DRIVER_LICENSE', 'CERTIFICATE', 'DIPLOMA', 'OTHER']),
  document_number: z.string().optional(),
  description: z.string().max(500).optional(),
});

async function uploadDocumentsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('Upload verification documents request', { userId });
  
  // Check if user is a master
  if (userRole !== 'MASTER') {
    return forbidden('Only masters can upload verification documents');
  }
  
  const userRepository = new UserRepository();
  const user = await userRepository.findById(userId);
  
  if (!user) {
    return forbidden('User not found');
  }
  
  // Parse base64 encoded body or multipart form data
  if (!event.body) {
    return badRequest('No file provided');
  }
  
  let fileBuffer: Buffer;
  try {
    // Check if it's multipart form data
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // For multipart, the body might already be processed by local server
      // Try to extract file from parsed body
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      if (body.fileBuffer) {
        fileBuffer = Buffer.from(body.fileBuffer, 'base64');
      } else if (body.file) {
        fileBuffer = Buffer.from(body.file, 'base64');
      } else {
        // Fallback: treat body as base64
        fileBuffer = event.isBase64Encoded 
          ? Buffer.from(event.body, 'base64')
          : Buffer.from(event.body, 'utf-8');
      }
    } else {
      fileBuffer = event.isBase64Encoded 
        ? Buffer.from(event.body, 'base64')
        : Buffer.from(event.body, 'utf-8');
    }
  } catch (error: any) {
    logger.error('Failed to parse file data', error);
    return badRequest('Invalid file data');
  }
  
  if (fileBuffer.length === 0) {
    return badRequest('Empty file provided');
  }
  
  // Validate file size (max 10MB for documents)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileBuffer.length > maxSize) {
    return badRequest('File size too large. Maximum 10MB allowed.');
  }
  
  // Parse query parameters for document metadata
  const queryParams = event.queryStringParameters || {};
  const metadataResult = uploadDocumentsSchema.safeParse({
    document_type: queryParams.document_type?.toUpperCase() || 'OTHER',
    document_number: queryParams.document_number,
    description: queryParams.description
  });
  
  if (!metadataResult.success) {
    return badRequest('Invalid document metadata: ' + metadataResult.error.message);
  }
  
  const metadata = metadataResult.data;
  
  // Determine file extension from content or default to jpg
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || 'image/jpeg';
  const fileExtension = getFileExtension(contentType);
  const fileName = `${Date.now()}_${metadata.document_type.toLowerCase()}${fileExtension}`;
  
  let fileUrl: string;
  
  try {
    if (isLocalDev) {
      // Local development: save to filesystem
      const uploadsDir = path.join(UPLOAD_PATH, 'verification', userId);
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, fileBuffer);
      
      // Return local URL
      fileUrl = `/uploads/verification/${userId}/${fileName}`;
      
      logger.info('Document saved locally', { filePath, fileUrl });
    } else {
      // Production: upload to S3
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const key = `verification/${userId}/${fileName}`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          userId,
          documentType: metadata.document_type,
          documentNumber: metadata.document_number || '',
          uploadedAt: new Date().toISOString()
        }
      }));
      
      fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    }
    
    const verificationRepository = new VerificationRepository();
    
    // Get or create verification record
    const verification = await verificationRepository.getOrCreateVerification(userId);
    
    // Add document to verification
    const updatedVerification = await verificationRepository.addDocument(verification.id, {
      type: metadata.document_type,
      url: fileUrl,
      fileName: fileName,
      notes: metadata.description
    });
    
    logger.info('Verification document uploaded successfully', { 
      userId, 
      fileUrl, 
      documentType: metadata.document_type 
    });
    
    const response = {
      message: 'Document uploaded successfully',
      document: {
        id: updatedVerification.documents[updatedVerification.documents.length - 1].id,
        type: metadata.document_type.toLowerCase(),
        url: fileUrl,
        file_name: fileName,
        status: 'pending',
        uploaded_at: new Date().toISOString()
      },
      verification_status: updatedVerification.status.toLowerCase(),
      total_documents: updatedVerification.documents.length
    };
    
    return success(response);
  } catch (error: any) {
    logger.error('Document upload failed', error);
    return badRequest('Failed to upload document: ' + error.message);
  }
}

function getFileExtension(contentType: string): string {
  if (contentType.includes('pdf')) return '.pdf';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  return '.jpg'; // Default to jpg for images
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(uploadDocumentsHandler)
  )
);
