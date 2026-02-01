// Get shared tracking

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { logger } from '@/shared/utils/logger';
import { LocationRepository } from '@/shared/repositories/location.repository';
import { getItem } from '@/shared/db/dynamodb-client';

const querySchema = z.object({
  shareCode: z.string(),
  trackingId: z.string(),
});

async function getSharedTrackingHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const queryParams = event.queryStringParameters || {};
  
  logger.info('Get shared tracking request', { userId, queryParams });
  
  const params = querySchema.parse(queryParams);
  
  const locationRepository = new LocationRepository();
  
  try {
    // Get share link
    const shareLink = await getItem({
      PK: `SHARE#${params.shareCode}`,
      SK: 'DETAILS',
    });
    
    if (!shareLink) {
      return notFound('Share link not found or expired');
    }
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(shareLink.expiresAt);
    if (now > expiresAt) {
      return forbidden('Share link has expired');
    }
    
    // Check permissions
    const canView = 
      shareLink.allowAnonymous ||
      shareLink.masterId === userId ||
      (shareLink.shareWith && shareLink.shareWith.includes(userId));
    
    if (!canView) {
      return forbidden('You do not have permission to view this tracking');
    }
    
    // Get tracking session
    const tracking = await locationRepository.getLocationTracking(params.trackingId);
    
    if (!tracking) {
      return notFound('Tracking session not found');
    }
    
    // Get latest location
    const location = await locationRepository.getLatestLocationUpdate(params.trackingId);
    
    const isLive = tracking.status === 'ACTIVE';
    
    const permissions = {
      canViewHistory: true,
      canViewRealTime: isLive,
      canViewStats: true,
    };
    
    logger.info('Shared tracking retrieved', { 
      userId, 
      trackingId: params.trackingId,
      shareCode: params.shareCode 
    });
    
    return success({
      tracking,
      location,
      isLive,
      permissions,
    });
  } catch (error) {
    logger.error('Failed to get shared tracking', error, { userId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(getSharedTrackingHandler)
  )
);
