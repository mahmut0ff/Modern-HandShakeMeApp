import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { logger } from '../shared/utils/logger';

const masterProfileRepository = new MasterProfileRepository();

// Extended schema to support all fields from mobile app
const updateMasterProfileSchema = z.object({
  // Basic info (from mobile edit-profile.tsx)
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  
  // Professional info
  company_name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(), // alias for bio
  bio: z.string().max(2000).optional(),
  experience_years: z.union([z.string(), z.number()]).optional(),
  
  // Location
  city: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  travel_radius: z.union([z.string(), z.number()]).optional(),
  
  // Work conditions
  has_transport: z.boolean().optional(),
  has_tools: z.boolean().optional(),
  can_purchase_materials: z.boolean().optional(),
  
  // Rates
  hourly_rate: z.union([z.string(), z.number()]).optional(),
  daily_rate: z.union([z.string(), z.number()]).optional(),
  min_order_cost: z.union([z.string(), z.number()]).optional(),
  
  // Working hours
  working_hours: z.record(z.string()).optional(),
  
  // Categories and skills
  categories: z.array(z.union([z.string(), z.number()])).optional(),
  skills: z.array(z.union([z.string(), z.number()])).optional(),
  
  // Availability
  is_available: z.boolean().optional(),
});

async function updateMasterProfileHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;
  
  logger.info('Update master profile', { userId });

  const body = JSON.parse(event.body || '{}');
  const validationResult = updateMasterProfileSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;

  // Parse numeric values
  const parseNumber = (val: string | number | undefined): number | undefined => {
    if (val === undefined) return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  };

  const updatedProfile = await masterProfileRepository.update(userId, {
    // Basic info
    firstName: data.first_name,
    lastName: data.last_name,
    
    // Professional info
    companyName: data.company_name,
    bio: data.description || data.bio,
    experienceYears: parseNumber(data.experience_years),
    
    // Location
    city: data.city,
    address: data.address,
    travelRadius: parseNumber(data.travel_radius),
    
    // Work conditions
    hasTransport: data.has_transport,
    hasTools: data.has_tools,
    canPurchaseMaterials: data.can_purchase_materials,
    
    // Rates
    hourlyRate: data.hourly_rate?.toString(),
    dailyRate: data.daily_rate?.toString(),
    minOrderCost: data.min_order_cost?.toString(),
    
    // Working hours
    workingHours: data.working_hours,
    
    // Categories and skills
    categories: data.categories?.map(c => typeof c === 'string' ? parseInt(c, 10) || 0 : c),
    skills: data.skills?.map(s => typeof s === 'string' ? parseInt(s, 10) || 0 : s),
    
    // Availability
    isAvailable: data.is_available,
  });

  logger.info('Master profile updated', { userId });

  return success(updatedProfile);
}

export const handler = withErrorHandler(withAuth(updateMasterProfileHandler, { roles: ['MASTER'] }));
