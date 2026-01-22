// Upload verification documents Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { S3Service } from '@/shared/services/s3';
import { success, badRequest, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

const s3Service = new S3Service();

const uploadDocumentsSchema = z.object({
  document_type: z.enum(['passport', 'id_card', 'license', 'certificate', 'other']),
  document_number: z.string().optional(),
});

async function uploadDocumentsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can upload verification documents');
  }
  
  logger.info('Upload verification documents request', { userId });
  
  try {
    // Parse multipart form data
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return badRequest('Content-Type must be multipart/form-data');
    }
    
    // Extract file from body
    const body = event.isBase64Encoded 
      ? Buffer.from(event.body || '', 'base64')
      : event.body;
    
    if (!body) {
      return badRequest('No file provided');
    }
    
    // Upload to S3
    const fileName = `verification/${userId}/${Date.now()}.pdf`;
    const fileUrl = await s3Service.uploadFile(fileName, body, 'application/pdf');
    
    const prisma = getPrismaClient();
    
    // Get or create master profile
    let masterProfile = await prisma.masterProfile.findUnique({
      where: { userId },
    });
    
    if (!masterProfile) {
      masterProfile = await prisma.masterProfile.create({
        data: {
          userId,
          verificationStatus: 'PENDING',
        },
      });
    }
    
    // Add document to list
    const documents = masterProfile.verificationDocuments || [];
    documents.push({
      url: fileUrl,
      type: 'document',
      uploaded_at: new Date().toISOString(),
    });
    
    // Update profile
    await prisma.masterProfile.update({
      where: { userId },
      data: {
        verificationDocuments: documents,
        verificationStatus: 'PENDING',
        updatedAt: new Date(),
      },
    });
    
    logger.info('Verification document uploaded successfully', { userId, fileUrl });
    
    return success({
      message: 'Document uploaded successfully',
      document_url: fileUrl,
      status: 'pending',
    }, 201);
  } catch (error) {
    logger.error('Document upload failed', { userId, error });
    return badRequest('Failed to upload document');
  }
}

export const handler = withErrorHandler(withAuth(uploadDocumentsHandler));
