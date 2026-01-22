// Update current user's client profile

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validateSafe } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const updateClientProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  preferredContactMethod: z.enum(['PHONE', 'EMAIL', 'BOTH']).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
});

async function updateMyClientProfileHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can access this endpoint');
  }
  
  logger.info('Update my client profile request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = validateSafe(updateClientProfileSchema, body);
  
  if (!result.success) {
    return forbidden('Invalid data');
  }
  
  const data = result.data;
  const prisma = getPrismaClient();
  
  // Update user fields
  const userUpdate: any = {};
  if (data.firstName) userUpdate.firstName = data.firstName;
  if (data.lastName) userUpdate.lastName = data.lastName;
  if (data.email) userUpdate.email = data.email;
  
  // Update client profile fields
  const profileUpdate: any = {};
  if (data.preferredContactMethod) profileUpdate.preferredContactMethod = data.preferredContactMethod;
  if (data.address) profileUpdate.address = data.address;
  if (data.city) profileUpdate.city = data.city;
  if (data.bio) profileUpdate.bio = data.bio;
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdate,
      clientProfile: {
        upsert: {
          create: profileUpdate,
          update: profileUpdate,
        },
      },
    },
    include: {
      clientProfile: true,
    },
  });
  
  const clientData = {
    id: user.id,
    phone: user.phone,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    avatar: user.avatar,
    isPhoneVerified: user.isPhoneVerified,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    profile: user.clientProfile,
  };
  
  return success(clientData);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateMyClientProfileHandler)));
