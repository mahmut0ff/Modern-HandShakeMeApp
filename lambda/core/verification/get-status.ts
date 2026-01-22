// Get verification status Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function getVerificationStatusHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can access verification status');
  }
  
  logger.info('Get verification status request', { userId });
  
  const prisma = getPrismaClient();
  
  // Get master profile with verification info
  const masterProfile = await prisma.masterProfile.findUnique({
    where: { userId },
    select: {
      verificationStatus: true,
      verificationDocuments: true,
      verificationNotes: true,
      verifiedAt: true,
    },
  });
  
  if (!masterProfile) {
    // Create default profile if doesn't exist
    const newProfile = await prisma.masterProfile.create({
      data: {
        userId,
        verificationStatus: 'PENDING',
      },
      select: {
        verificationStatus: true,
        verificationDocuments: true,
        verificationNotes: true,
        verifiedAt: true,
      },
    });
    
    logger.info('Master profile created', { userId });
    
    return success({
      status: newProfile.verificationStatus.toLowerCase(),
      documents: newProfile.verificationDocuments || [],
      notes: newProfile.verificationNotes,
      verified_at: newProfile.verifiedAt?.toISOString(),
    });
  }
  
  logger.info('Verification status retrieved successfully', { userId });
  
  return success({
    status: masterProfile.verificationStatus.toLowerCase(),
    documents: masterProfile.verificationDocuments || [],
    notes: masterProfile.verificationNotes,
    verified_at: masterProfile.verifiedAt?.toISOString(),
  });
}

export const handler = withErrorHandler(withAuth(getVerificationStatusHandler));
