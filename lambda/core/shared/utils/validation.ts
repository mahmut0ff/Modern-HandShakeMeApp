import { z } from 'zod';

export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (data: any): T => {
    return schema.parse(data);
  };
}

export function validate<T>(schema: z.ZodSchema<T>, data: any): T {
  return schema.parse(data);
}

// Phone-based registration schema
export const phoneRegistrationSchema = z.object({
  phone: z.string()
    .regex(/^\+996\d{9}$/, 'Invalid Kyrgyzstan phone number format (+996XXXXXXXXX)'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  role: z.enum(['client', 'master'], {
    errorMap: () => ({ message: 'Role must be either client or master' })
  }),
});

// Phone-based login schema
export const phoneLoginSchema = z.object({
  phone: z.string()
    .regex(/^\+996\d{9}$/, 'Invalid Kyrgyzstan phone number format (+996XXXXXXXXX)'),
  code: z.string()
    .regex(/^\d{4}$/, 'Verification code must be 4 digits')
    .optional(),
});

// Phone verification schema
export const phoneVerificationSchema = z.object({
  phone: z.string()
    .regex(/^\+996\d{9}$/, 'Invalid Kyrgyzstan phone number format (+996XXXXXXXXX)'),
  code: z.string()
    .regex(/^\d{4}$/, 'Verification code must be 4 digits'),
});

// Resend verification schema
export const resendVerificationSchema = z.object({
  phone: z.string()
    .regex(/^\+996\d{9}$/, 'Invalid Kyrgyzstan phone number format (+996XXXXXXXXX)'),
});

// Enhanced order creation schema to match mobile app
export const orderSchema = z.object({
  category: z.number().int().positive('Category ID must be a positive integer'),
  subcategory: z.number().int().positive().optional(),
  requiredSkills: z.array(z.number().int().positive()).optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  address: z.string().max(500, 'Address too long').optional(),
  hideAddress: z.boolean().optional().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isUrgent: z.boolean().optional().default(false),
  workVolume: z.string().max(200, 'Work volume description too long').optional(),
  floor: z.number().int().min(0).max(100).optional(),
  hasElevator: z.boolean().optional(),
  materialStatus: z.enum(['client_provides', 'master_provides', 'master_buys', 'need_consultation', 'to_discuss']).optional(),
  hasElectricity: z.boolean().optional(),
  hasWater: z.boolean().optional(),
  canStoreTools: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  requiredExperience: z.string().max(100).optional(),
  needTeam: z.boolean().optional().default(false),
  additionalRequirements: z.string().max(1000, 'Additional requirements too long').optional(),
  budgetType: z.enum(['fixed', 'range', 'negotiable']).default('negotiable'),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  isPublic: z.boolean().optional().default(true),
  autoCloseApplications: z.boolean().optional().default(true),
}).refine((data) => {
  // Validate budget range
  if (data.budgetType === 'fixed' && !data.budgetMin) {
    return false;
  }
  if (data.budgetType === 'range' && (!data.budgetMin || !data.budgetMax)) {
    return false;
  }
  if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
    return false;
  }
  return true;
}, {
  message: 'Invalid budget configuration',
});

// Service creation schema with mobile-compatible units
export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters').max(100, 'Service name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.number().int().positive('Category ID must be a positive integer'),
  priceFrom: z.number().positive('Price must be positive'),
  priceTo: z.number().positive('Price must be positive').optional(),
  unit: z.enum(['hour', 'sqm', 'piece', 'project', 'day'], {
    errorMap: () => ({ message: 'Invalid unit type' })
  }),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
}).refine((data) => {
  // Validate price range
  if (data.priceTo && data.priceTo < data.priceFrom) {
    return false;
  }
  return true;
}, {
  message: 'Price "to" must be greater than price "from"',
});

// Application creation schema
export const applicationSchema = z.object({
  order_id: z.number().int().positive('Order ID must be a positive integer'),
  proposal: z.string().min(10, 'Proposal must be at least 10 characters').max(2000, 'Proposal too long'),
  price: z.number().positive('Price must be positive'),
  estimatedDuration: z.number().int().positive().optional(),
  coverLetter: z.string().max(1000).optional(),
});

// Project update schema
export const projectSchema = z.object({
  status: z.enum(['new', 'in_progress', 'review', 'revision', 'completed', 'archived']).optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

// User update schema
export const userUpdateSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  page_size: z.number().int().positive().max(100).optional().default(20),
  sort_by: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Safe validation that returns result instead of throwing
export function validateSafe<T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// Legacy schemas for backward compatibility
export const registrationSchema = phoneRegistrationSchema;
export const loginSchema = phoneLoginSchema;