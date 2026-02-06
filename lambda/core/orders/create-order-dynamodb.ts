import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler, ValidationError } from '../shared/middleware/errorHandler';
import { OrderRepository } from '../shared/repositories/order.repository';
import { logger } from '../shared/utils/logger';

// Support both camelCase and snake_case, both string and number for category
const createOrderSchema = z.object({
  // Category - support both naming conventions and types
  categoryId: z.union([z.string(), z.number()]).optional(),
  category: z.union([z.string(), z.number()]).optional(),
  subcategory: z.union([z.string(), z.number()]).optional(),
  required_skills: z.array(z.union([z.string(), z.number()])).optional(),
  
  // Basic info
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  
  // Location
  city: z.string(),
  address: z.string().optional().default(''),
  hideAddress: z.boolean().optional(),
  hide_address: z.boolean().optional(),
  
  // Budget - support both UPPERCASE and lowercase
  budgetType: z.enum(['FIXED', 'RANGE', 'NEGOTIABLE', 'fixed', 'range', 'negotiable']).optional(),
  budget_type: z.enum(['FIXED', 'RANGE', 'NEGOTIABLE', 'fixed', 'range', 'negotiable']).optional(),
  budgetMin: z.number().optional(),
  budget_min: z.number().optional(),
  budgetMax: z.number().optional(),
  budget_max: z.number().optional(),
  
  // Dates
  startDate: z.string().optional(),
  start_date: z.string().optional(),
  endDate: z.string().optional(),
  end_date: z.string().optional(),
  
  // Urgency
  isUrgent: z.boolean().optional(),
  is_urgent: z.boolean().optional(),
  
  // Extended fields from mobile app
  work_volume: z.string().optional(),
  floor: z.number().optional(),
  has_elevator: z.boolean().nullable().optional(),
  material_status: z.string().optional(),
  has_electricity: z.boolean().nullable().optional(),
  has_water: z.boolean().nullable().optional(),
  can_store_tools: z.boolean().nullable().optional(),
  has_parking: z.boolean().nullable().optional(),
  required_experience: z.string().optional(),
  need_team: z.boolean().optional(),
  additional_requirements: z.string().optional(),
  is_public: z.boolean().optional(),
  auto_close_applications: z.boolean().optional(),
}).refine(data => data.categoryId || data.category, {
  message: 'Either categoryId or category is required',
});

async function createOrderHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const { userId } = event.auth;

  logger.info('Create order request', { userId });

  const body = JSON.parse(event.body || '{}');
  const validationResult = createOrderSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors);
  }
  
  const data = validationResult.data;

  // Normalize field names (support both camelCase and snake_case)
  const normalizedData = {
    categoryId: String(data.categoryId || data.category),
    subcategoryId: data.subcategory ? String(data.subcategory) : undefined,
    requiredSkills: data.required_skills?.map(s => String(s)),
    title: data.title,
    description: data.description,
    city: data.city,
    address: data.address || '',
    hideAddress: data.hideAddress ?? data.hide_address ?? false,
    budgetType: (data.budgetType || data.budget_type || 'NEGOTIABLE').toUpperCase() as 'FIXED' | 'RANGE' | 'NEGOTIABLE',
    budgetMin: data.budgetMin ?? data.budget_min,
    budgetMax: data.budgetMax ?? data.budget_max,
    startDate: data.startDate || data.start_date,
    endDate: data.endDate || data.end_date,
    isUrgent: data.isUrgent ?? data.is_urgent ?? false,
    // Extended fields
    workVolume: data.work_volume,
    floor: data.floor,
    hasElevator: data.has_elevator,
    materialStatus: data.material_status,
    hasElectricity: data.has_electricity,
    hasWater: data.has_water,
    canStoreTools: data.can_store_tools,
    hasParking: data.has_parking,
    requiredExperience: data.required_experience,
    needTeam: data.need_team,
    additionalRequirements: data.additional_requirements,
    isPublic: data.is_public ?? true,
    autoCloseApplications: data.auto_close_applications ?? true,
    clientId: userId,
  };

  const orderRepo = new OrderRepository();
  const order = await orderRepo.create(normalizedData);

  logger.info('Order created', { userId, orderId: order.id });

  return success(order, 201);
}

export const handler = withErrorHandler(withAuth(createOrderHandler, { roles: ['CLIENT'] }));
