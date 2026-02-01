// Upload verification documents Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { success, badRequest, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { VerificationRepository } from '../shared/repositories/verification.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { z } from 'zod';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'handshake-uploads';

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
  
  // Parse base64 encoded body
  if (!event.body) {
    return badRequest('No file provided');
  }
  
  let fileBuffer: Buffer;
  try {
    fileBuffer = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'utf-8');
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
    document_type: queryParams.document_type?.toUpperCase(),
    document_number: queryParams.document_number,
    description: queryParams.description
  });
  
  if (!metadataResult.success) {
    return badRequest('Invalid document metadata');
  }
  
  const metadata = metadataResult.data;
  
  // Validate file type
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || 'application/pdf';
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.some(type => contentType.includes(type))) {
    return badRequest('Invalid file type. Only PDF and image files are allowed.');
  }
  
  // Upload document to S3
  const fileExtension = getFileExtension(contentType);
  const fileName = `${Date.now()}_${metadata.document_type.toLowerCase()}${fileExtension}`;
  const key = `verification/${userId}/${fileName}`;
  
  try {
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
    
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
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
    return badRequest('Failed to upload document to S3');
  }
}

function getFileExtension(contentType: string): string {
  switch (contentType) {
    case 'application/pdf':
      return '.pdf';
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.pdf';
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(uploadDocumentsHandler)
  )
);
