// Upload face photo (selfie) for verification

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success, badRequest, forbidden } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { VerificationRepository } from '../shared/repositories/verification.repository';
import { uploadToStorage } from '../shared/utils/file-storage';

async function uploadFacePhotoHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Upload face photo request', { userId });
  
  if (!event.body) {
    return badRequest('No file provided');
  }
  
  let fileBuffer: Buffer;
  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      if (body.fileBuffer) {
        fileBuffer = Buffer.from(body.fileBuffer, 'base64');
      } else if (body.file) {
        fileBuffer = Buffer.from(body.file, 'base64');
      } else {
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
  
  // Validate file size (max 5MB for photos)
  const maxSize = 5 * 1024 * 1024;
  if (fileBuffer.length > maxSize) {
    return badRequest('File size too large. Maximum 5MB allowed.');
  }
  
  // Validate image type
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || 'image/jpeg';
  if (!contentType.includes('image/')) {
    return badRequest('Only image files are allowed');
  }
  
  try {
    const verificationRepository = new VerificationRepository();
    
    // Get or create verification record
    const verification = await verificationRepository.getOrCreateVerification(userId);
    
    // Check if already approved
    if (verification.status === 'APPROVED') {
      return badRequest('Verification already approved');
    }
    
    // Upload file
    const fileName = `face_${Date.now()}.jpg`;
    const fileUrl = await uploadToStorage(fileBuffer, `verification/${userId}/${fileName}`, contentType);
    
    // Remove old face photo if exists
    const updatedDocuments = verification.documents.filter(doc => doc.type !== 'FACE_PHOTO');
    
    // Add new face photo
    const updatedVerification = await verificationRepository.update(verification.id, {
      documents: [
        ...updatedDocuments,
        {
          id: `face_${Date.now()}`,
          type: 'FACE_PHOTO',
          url: fileUrl,
          fileName: fileName,
          uploadedAt: new Date().toISOString(),
          status: 'PENDING',
        }
      ],
    });
    
    logger.info('Face photo uploaded successfully', { userId, fileUrl });
    
    const facePhoto = updatedVerification.documents.find(doc => doc.type === 'FACE_PHOTO');
    
    return success({
      message: 'Face photo uploaded successfully',
      photo: {
        id: facePhoto?.id,
        type: 'face_photo',
        url: fileUrl,
        uploaded_at: facePhoto?.uploadedAt,
      },
      verification_status: updatedVerification.status.toLowerCase(),
    });
  } catch (error: any) {
    logger.error('Face photo upload failed', error);
    return badRequest('Failed to upload photo: ' + error.message);
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(uploadFacePhotoHandler)
  )
);
