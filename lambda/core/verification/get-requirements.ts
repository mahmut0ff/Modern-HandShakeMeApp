// Get verification requirements

import type { APIGatewayProxyResult } from 'aws-lambda';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

async function getVerificationRequirementsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Get verification requirements request', { userId });
  
  const requirements = {
    documents: [
      {
        type: 'ID_CARD',
        name: 'National ID Card or Passport',
        description: 'Clear photo of your government-issued ID',
        required: true,
      },
      {
        type: 'SELFIE',
        name: 'Selfie with ID',
        description: 'Photo of yourself holding your ID next to your face',
        required: true,
      },
      {
        type: 'PROOF_OF_ADDRESS',
        name: 'Proof of Address',
        description: 'Utility bill or bank statement (not older than 3 months)',
        required: false,
      },
      {
        type: 'BUSINESS_LICENSE',
        name: 'Business License',
        description: 'For masters: business registration or trade license',
        required: false,
      },
    ],
    guidelines: [
      'All documents must be clear and readable',
      'Photos should be in color',
      'Documents must be valid and not expired',
      'Selfie must clearly show your face and ID',
      'Processing time: 1-3 business days',
    ],
  };
  
  return success(requirements);
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getVerificationRequirementsHandler)
  )
);
