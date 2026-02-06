// Get profile visibility settings Lambda function

import { APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';

const masterProfileRepository = new MasterProfileRepository();

const getProfileVisibilityHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId, role } = event.auth;
  
  if (role !== 'MASTER') {
    return forbidden('Only masters can access profile visibility settings');
  }
  
  logger.info('Get profile visibility request', { userId });
  
  // Get master profile
  let masterProfile = await masterProfileRepository.findByUserId(userId);
  
  if (!masterProfile) {
    // Create default profile with default visibility settings
    masterProfile = await masterProfileRepository.create(userId, {
      city: '',
      isAvailable: true
    });
    
    logger.info('Master profile created with default visibility', { userId });
  }
  
  logger.info('Profile visibility retrieved successfully', { userId });
  
  // Return visibility settings (using defaults if not set)
  return success({
    is_profile_public: true,
    show_phone: true,
    show_email: false,
    show_location: true,
    show_rating: true,
    show_reviews: true,
    show_portfolio: true,
    show_services: true,
  });
};

export const handler = withErrorHandler(withAuth(getProfileVisibilityHandler, { roles: ['MASTER'] }));
