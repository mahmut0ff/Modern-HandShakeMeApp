// Share tracking link

import type { APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { success, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';
import { LocationRepository } from '@/shared/repositories/location.repository';
import { putItem } from '@/shared/db/dynamodb-client';

const shareSchema = z.object({
  trackingId: z.string(),
  shareWith: z.array(z.string()).optional(),
  expirationHours: z.number().min(1).max(168).default(24),
  allowAnonymous: z.boolean().default(false),
});

async function shareTrackingLinkHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Share tracking link request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(shareSchema, body);
  
  const locationRepository = new LocationRepository();
  
  try {
    // Get tracking session
    const tracking = await locationRepository.getLocationTracking(data.trackingId);
    
    if (!tracking) {
      return notFound('Tracking session not found');
    }
    
    // Check permissions - only master can share
    if (tracking.masterId !== userId) {
      return forbidden('Only the master can share this tracking session');
    }
    
    // Create share code
    const shareCode = uuidv4().substring(0, 8).toUpperCase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + data.expirationHours * 60 * 60 * 1000);
    
    // Store share link
    await putItem({
      PK: `SHARE#${shareCode}`,
      SK: 'DETAILS',
      trackingId: data.trackingId,
      masterId: userId,
      shareWith: data.shareWith || [],
      allowAnonymous: data.allowAnonymous,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      ttl: Math.floor(expiresAt.getTime() / 1000),
    });
    
    const trackingUrl = `${process.env.FRONTEND_URL}/tracking/shared/${shareCode}`;
    
    logger.info('Tracking link shared', { 
      userId, 
      trackingId: data.trackingId,
      shareCode 
    });
    
    return success({
      trackingUrl,
      shareCode,
      expiresAt: expiresAt.toISOString(),
      message: 'Tracking link created successfully',
    });
  } catch (error) {
    logger.error('Failed to share tracking link', error, { userId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(shareTrackingLinkHandler)
  )
);
