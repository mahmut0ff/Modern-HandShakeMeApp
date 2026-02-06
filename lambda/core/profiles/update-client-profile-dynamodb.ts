import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { ClientProfileRepository } from '../shared/repositories/client-profile.repository';
import { logger } from '../shared/utils/logger';

const clientProfileRepository = new ClientProfileRepository();

// Extended schema to support all fields from mobile app
const updateClientProfileSchema = z.object({
  // Basic info (from mobile edit-profile.tsx)
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  
  // About - support both 'about' and 'bio' field names
  about: z.string().max(1000).optional(),
  bio: z.string().max(1000).optional(),
  
  // Location
  city: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  
  // Company
  company_name: z.string().max(200).optional(),
  
  // Contact preferences
  preferred_contact_method: z.enum(['phone', 'email', 'chat']).optional(),
});

async function updateClientProfileHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  
  logger.info('Update client profile', { userId });

  const body = JSON.parse(event.body || '{}');
  const validationResult = updateClientProfileSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;

  const updatedProfile = await clientProfileRepository.update(userId, {
    // Basic info
    firstName: data.first_name,
    lastName: data.last_name,
    
    // Bio - support both field names
    bio: data.about || data.bio,
    
    // Location
    city: data.city,
    address: data.address,
    
    // Company
    companyName: data.company_name,
    
    // Contact preferences
    preferredContactMethod: data.preferred_contact_method,
  });

  logger.info('Client profile updated', { userId });

  return success(updatedProfile);
}

export const handler = withErrorHandler(withAuth(updateClientProfileHandler, { roles: ['CLIENT'] }));
