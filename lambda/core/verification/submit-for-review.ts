// Submit verification for review

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success, badRequest } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';

async function submitVerificationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Submit verification request', { userId });
  
  const prisma = getPrismaClient();
  
  // Check if user has uploaded required documents
  const documents = await prisma.verificationDocument.findMany({
    where: { userId },
  });
  
  if (documents.length === 0) {
    return badRequest('Please upload verification documents first');
  }
  
  // Update or create verification status
  const verification = await prisma.verification.upsert({
    where: { userId },
    create: {
      userId,
      status: 'PENDING',
      submittedAt: new Date(),
    },
    update: {
      status: 'PENDING',
      submittedAt: new Date(),
    },
  });
  
  return success({ 
    message: 'Verification submitted for review',
    verification,
  });
}

export const handler = withErrorHandler(withRequestTransform(withAuth(submitVerificationHandler)));
