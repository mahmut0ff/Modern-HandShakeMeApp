/**
 * Data Normalizers
 * Унификация данных из разных API endpoints
 */

import type { MasterProfile, User, Order } from '../types/api';

/**
 * Normalize master profile data
 * Унифицирует данные мастера из разных источников
 */
export function normalizeMasterProfile(data: any): MasterProfile {
  // Handle nested user object or flat structure
  const user: User = data.user || {
    id: data.user_id,
    telegram_id: '',
    first_name: data.user_first_name || data.first_name || '',
    last_name: data.user_last_name || data.last_name || '',
    full_name: data.user_full_name || data.full_name,
    avatar: data.user_avatar || data.avatar,
    role: 'master',
    is_verified: data.is_verified || false,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };

  return {
    id: data.id,
    user,
    user_id: user.id,
    user_full_name: getFullName(user),
    user_first_name: user.first_name,
    user_last_name: user.last_name,
    user_avatar: user.avatar,
    company_name: data.company_name,
    bio: data.bio,
    city: data.city,
    hourly_rate: data.hourly_rate,
    experience_years: data.experience_years || 0,
    rating: data.rating,
    completed_orders: data.completed_orders || data.completed_projects_count || 0,
    completed_projects_count: data.completed_projects_count || data.completed_orders || 0,
    is_verified: data.is_verified || false,
    is_available: data.is_available || false,
    has_transport: data.has_transport || false,
    has_tools: data.has_tools || false,
    portfolio_items: data.portfolio_items || data.portfolio_preview || [],
    portfolio_preview: data.portfolio_preview || data.portfolio_items || [],
    categories: data.categories || [],
    skills: data.skills || [],
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
}

/**
 * Get full name from user object
 */
export function getFullName(user: Partial<User> | null | undefined): string {
  if (!user) return 'Пользователь';
  
  if (user.full_name) return user.full_name;
  
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  
  return `${firstName} ${lastName}`.trim() || 'Пользователь';
}

/**
 * Get avatar URL with fallback
 */
export function getAvatarUrl(user: Partial<User> | null | undefined): string | undefined {
  if (!user) return undefined;
  return user.avatar;
}

/**
 * Normalize order data
 */
export function normalizeOrder(data: any): Order {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    category_name: data.category_name || '',
    client: data.client,
    client_name: data.client_name || data.client?.name,
    status: data.status,
    budget_min: data.budget_min,
    budget_max: data.budget_max,
    budget_display: data.budget_display || formatBudget(data.budget_min, data.budget_max),
    city: data.city,
    address: data.address,
    floor: data.floor,
    work_volume: data.work_volume,
    start_date: data.start_date,
    end_date: data.end_date,
    is_urgent: data.is_urgent || false,
    has_elevator: data.has_elevator,
    has_electricity: data.has_electricity,
    has_water: data.has_water,
    can_store_tools: data.can_store_tools,
    has_parking: data.has_parking,
    skills_list: data.skills_list || [],
    files: data.files || [],
    applications_count: data.applications_count || 0,
    views_count: data.views_count || 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Format budget display
 */
function formatBudget(min?: number, max?: number): string {
  if (!min && !max) return 'Договорная';
  if (min && max && min !== max) return `${min} - ${max} сом`;
  if (min) return `от ${min} сом`;
  if (max) return `до ${max} сом`;
  return 'Договорная';
}

/**
 * Normalize paginated response
 */
export function normalizePaginatedResponse<T>(
  data: any,
  normalizer?: (item: any) => T
): { results: T[]; count: number; next: string | null; previous: string | null } {
  // Handle array response (non-paginated)
  if (Array.isArray(data)) {
    const results = normalizer ? data.map(normalizer) : data;
    return {
      results,
      count: results.length,
      next: null,
      previous: null,
    };
  }

  // Handle paginated response
  const results = normalizer && data.results 
    ? data.results.map(normalizer) 
    : data.results || [];

  return {
    results,
    count: data.count || results.length,
    next: data.next || null,
    previous: data.previous || null,
  };
}

/**
 * Normalize user data
 */
export function normalizeUser(data: any): User {
  return {
    id: data.id,
    telegram_id: data.telegram_id || '',
    first_name: data.first_name || '',
    last_name: data.last_name,
    full_name: data.full_name || getFullName(data),
    username: data.username,
    phone: data.phone,
    email: data.email,
    avatar: data.avatar,
    role: data.role || 'client',
    is_verified: data.is_verified || false,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
}

/**
 * Safe number parser
 */
export function safeParseNumber(value: any, defaultValue: number = 0): number {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safe boolean parser
 */
export function safeParseBoolean(value: any, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return defaultValue;
}

/**
 * Normalize portfolio item
 */
export function normalizePortfolioItem(data: any) {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    images: data.images || [],
    after_image: data.after_image,
    media: data.media || [],
    created_at: data.created_at,
  };
}
