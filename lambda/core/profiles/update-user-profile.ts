/**
 * Update User Profile Lambda Function
 * Handles profile updates with validation and privacy controls
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, notFound, badRequest } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { UserRepository } from '../shared/repositories/user.repository';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { ClientProfileRepository } from '../shared/repositories/client-profile.repository';

const userRepository = new UserRepository();
const masterProfileRepository = new MasterProfileRepository();
const clientProfileRepository = new ClientProfileRepository();

const UpdateProfileSchema = z.object({
  // Basic info
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  
  // Master-specific fields
  bio: z.string().max(1000).optional(),
  city: z.string().min(2).max(100).optional(),
  address: z.string().max(200).optional(),
  categories: z.array(z.number()).max(10).optional(),
  skills: z.array(z.number()).max(20).optional(),
  hourlyRate: z.string().optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  education: z.string().max(500).optional(),
  workSchedule: z.string().max(200).optional(),
  isAvailable: z.boolean().optional(),
  
  // Client-specific fields
  companyName: z.string().max(100).optional(),
  companyType: z.string().max(50).optional(),
  preferredContactMethod: z.enum(['phone', 'chat', 'email']).optional(),
});

const updateUserProfileHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  const updates = UpdateProfileSchema.parse(JSON.parse(event.body || '{}'));
  
  logger.info('Update user profile request', { userId });
  
  // Get current user
  const currentUser = await userRepository.findById(userId);
  if (!currentUser) {
    return notFound('User not found');
  }
  
  // Validate updates
  const validationResult = await validateUpdates(updates, currentUser);
  if (!validationResult.isValid) {
    return badRequest('Profile validation failed', validationResult.errors);
  }
  
  // Update user basic info
  const userUpdates: any = {};
  if (updates.firstName) userUpdates.firstName = updates.firstName;
  if (updates.lastName) userUpdates.lastName = updates.lastName;
  if (updates.email) userUpdates.email = updates.email;
  if (updates.avatar) userUpdates.avatar = updates.avatar;
  
  let updatedUser = currentUser;
  if (Object.keys(userUpdates).length > 0) {
    updatedUser = await userRepository.update(userId, userUpdates);
  }
  
  // Update role-specific profile
  let updatedProfile = null;
  if (currentUser.role === 'MASTER') {
    const masterUpdates: any = {};
    if (updates.bio !== undefined) masterUpdates.bio = updates.bio;
    if (updates.city !== undefined) masterUpdates.city = updates.city;
    if (updates.categories !== undefined) masterUpdates.categories = updates.categories;
    if (updates.skills !== undefined) masterUpdates.skills = updates.skills;
    if (updates.hourlyRate !== undefined) masterUpdates.hourlyRate = updates.hourlyRate;
    if (updates.experienceYears !== undefined) masterUpdates.experienceYears = updates.experienceYears;
    if (updates.isAvailable !== undefined) masterUpdates.isAvailable = updates.isAvailable;
    
    if (Object.keys(masterUpdates).length > 0) {
      let profile = await masterProfileRepository.findByUserId(userId);
      if (!profile) {
        profile = await masterProfileRepository.create(userId, masterUpdates);
      } else {
        profile = await masterProfileRepository.update(userId, masterUpdates);
      }
      updatedProfile = profile;
    }
  } else if (currentUser.role === 'CLIENT') {
    const clientUpdates: any = {};
    if (updates.bio !== undefined) clientUpdates.bio = updates.bio;
    if (updates.city !== undefined) clientUpdates.city = updates.city;
    if (updates.companyName !== undefined) clientUpdates.companyName = updates.companyName;
    if (updates.companyType !== undefined) clientUpdates.companyType = updates.companyType;
    if (updates.preferredContactMethod !== undefined) clientUpdates.preferredContactMethod = updates.preferredContactMethod;
    
    if (Object.keys(clientUpdates).length > 0) {
      let profile = await clientProfileRepository.findByUserId(userId);
      if (!profile) {
        profile = await clientProfileRepository.create(userId, clientUpdates);
      } else {
        profile = await clientProfileRepository.update(userId, clientUpdates);
      }
      updatedProfile = profile;
    }
  }
  
  // Check if profile is now complete
  const completionStatus = checkProfileCompletion(updatedUser, updatedProfile);
  
  logger.info('Profile updated successfully', { userId });
  
  return success({
    user: {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      isPhoneVerified: updatedUser.isPhoneVerified,
      isEmailVerified: updatedUser.isEmailVerified,
      updatedAt: updatedUser.updatedAt
    },
    profile: updatedProfile,
    completion: completionStatus,
    message: 'Profile updated successfully'
  });
};

async function validateUpdates(updates: any, currentUser: any) {
  const errors: string[] = [];
  
  // Check email uniqueness if email is being updated
  if (updates.email && updates.email !== currentUser.email) {
    const existingUser = await userRepository.findByPhone(updates.email);
    if (existingUser && existingUser.id !== currentUser.id) {
      errors.push('Email is already in use');
    }
  }
  
  // Validate hourly rate format
  if (updates.hourlyRate) {
    const rate = parseFloat(updates.hourlyRate);
    if (isNaN(rate) || rate < 0) {
      errors.push('Invalid hourly rate format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function checkProfileCompletion(user: any, profile: any) {
  const requiredFields = ['firstName', 'lastName'];
  
  if (user.role === 'MASTER') {
    requiredFields.push('bio', 'city', 'categories', 'skills', 'hourlyRate');
  } else if (user.role === 'CLIENT') {
    requiredFields.push('city');
  }
  
  const completedFields = requiredFields.filter(field => {
    const userValue = user[field];
    const profileValue = profile?.[field];
    const value = userValue || profileValue;
    
    return value !== undefined && value !== null && value !== '' && 
           (Array.isArray(value) ? value.length > 0 : true);
  });
  
  const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
  const isComplete = completionPercentage >= 80;
  
  return {
    percentage: completionPercentage,
    isComplete,
    missingFields: requiredFields.filter(field => !completedFields.includes(field))
  };
}

export const handler = withErrorHandler(withAuth(updateUserProfileHandler));
