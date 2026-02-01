/**
 * API Data Transformation Utilities
 * Handles conversion between mobile camelCase and backend snake_case
 */

// FIXED: Utility functions to handle API data transformation
export function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = camelToSnake(value);
  }
  return result;
}

export function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = snakeToCamel(value);
  }
  return result;
}

// Specific transformers for common API objects
export function transformOrderForAPI(order: any) {
  return {
    ...camelToSnake(order),
    // Handle specific field mappings
    budget_min: order.budgetMin?.toString(),
    budget_max: order.budgetMax?.toString(),
    budget_type: order.budgetType,
    material_status: order.materialStatus,
    required_skills: order.requiredSkills,
    hide_address: order.hideAddress,
    has_elevator: order.hasElevator,
    has_electricity: order.hasElectricity,
    has_water: order.hasWater,
    can_store_tools: order.canStoreTools,
    has_parking: order.hasParking,
    required_experience: order.requiredExperience,
    need_team: order.needTeam,
    additional_requirements: order.additionalRequirements,
    is_urgent: order.isUrgent,
    is_public: order.isPublic,
    auto_close_applications: order.autoCloseApplications,
    start_date: order.startDate,
    end_date: order.endDate,
  };
}

export function transformOrderFromAPI(order: any) {
  return {
    ...snakeToCamel(order),
    // Handle specific field mappings
    budgetMin: order.budget_min,
    budgetMax: order.budget_max,
    budgetType: order.budget_type,
    materialStatus: order.material_status,
    requiredSkills: order.required_skills,
    hideAddress: order.hide_address,
    hasElevator: order.has_elevator,
    hasElectricity: order.has_electricity,
    hasWater: order.has_water,
    canStoreTools: order.can_store_tools,
    hasParking: order.has_parking,
    requiredExperience: order.required_experience,
    needTeam: order.need_team,
    additionalRequirements: order.additional_requirements,
    isUrgent: order.is_urgent,
    isPublic: order.is_public,
    autoCloseApplications: order.auto_close_applications,
    startDate: order.start_date,
    endDate: order.end_date,
    applicationsCount: order.applications_count,
    viewsCount: order.views_count,
    isFavorite: order.is_favorite,
    hasApplied: order.has_applied,
    applicationId: order.application_id,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export function transformUserForAPI(user: any) {
  return {
    ...camelToSnake(user),
    first_name: user.firstName,
    last_name: user.lastName,
    full_name: user.fullName,
    is_phone_verified: user.isPhoneVerified,
    two_factor_enabled: user.twoFactorEnabled,
    last_seen: user.lastSeen,
    created_at: user.createdAt,
  };
}

export function transformUserFromAPI(user: any) {
  return {
    ...snakeToCamel(user),
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: user.full_name,
    isPhoneVerified: user.is_phone_verified,
    twoFactorEnabled: user.two_factor_enabled,
    lastSeen: user.last_seen,
    createdAt: user.created_at,
  };
}