/**
 * Response formatting utilities for API consistency
 */

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export function formatPaginatedResponse<T>(
  items: T[],
  total: number,
  page?: number,
  pageSize?: number
): PaginatedResponse<T> {
  return {
    results: items,
    count: total,
    next: page && pageSize && (page * pageSize < total)
      ? `?page=${page + 1}`
      : null,
    previous: page && page > 1
      ? `?page=${page - 1}`
      : null
  };
}

export function formatUserObject(user: any) {
  return {
    id: user.userId || user.id,
    phone: user.phone,
    role: user.role,
    first_name: user.firstName || user.first_name,
    last_name: user.lastName || user.last_name,
    full_name: user.fullName || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim(),
    avatar: user.avatar,
    is_phone_verified: user.isPhoneVerified ?? user.is_phone_verified ?? false,
    last_seen: user.lastSeen || user.last_seen,
    created_at: user.createdAt || user.created_at
  };
}

export function formatOrderObject(order: any) {
  return {
    id: order.orderId || order.id,
    client: order.client || {
      id: order.clientId,
      name: order.clientName,
      avatar: order.clientAvatar,
      rating: order.clientRating
    },
    category: order.categoryId || order.category,
    category_name: order.categoryName || order.category_name,
    subcategory: order.subcategoryId || order.subcategory,
    title: order.title,
    description: order.description,
    city: order.city,
    address: order.address,
    hide_address: order.hideAddress ?? order.hide_address,
    budget_type: order.budgetType || order.budget_type,
    budget_min: order.budgetMin || order.budget_min,
    budget_max: order.budgetMax || order.budget_max,
    status: order.status,
    applications_count: order.applicationsCount || order.applications_count || 0,
    views_count: order.viewsCount || order.views_count || 0,
    is_urgent: order.isUrgent || order.is_urgent || false,

    // Additional details
    work_volume: order.workVolume || order.work_volume,
    floor: order.floor,
    has_elevator: order.hasElevator ?? order.has_elevator,
    material_status: order.materialStatus || order.material_status,
    has_electricity: order.hasElectricity ?? order.has_electricity,
    has_water: order.hasWater ?? order.has_water,
    can_store_tools: order.canStoreTools ?? order.can_store_tools,
    has_parking: order.hasParking ?? order.has_parking,
    required_experience: order.requiredExperience || order.required_experience,
    need_team: order.needTeam ?? order.need_team,
    additional_requirements: order.additionalRequirements || order.additional_requirements,
    images: order.images || [],

    created_at: order.createdAt || order.created_at,
    updated_at: order.updatedAt || order.updated_at
  };
}

export function formatApplicationObject(application: any) {
  return {
    id: application.applicationId || application.id,
    order_id: application.orderId || application.order,
    order_title: application.orderTitle || application.order_title,
    master_id: application.masterId,
    master: application.master || {
      id: application.masterId,
      name: application.masterName,
      avatar: application.masterAvatar,
      rating: application.masterRating
    },
    client_id: application.clientId,
    client: application.client || {
      id: application.clientId,
      name: application.clientName,
      avatar: application.clientAvatar,
      rating: application.clientRating
    },
    cover_letter: application.coverLetter || application.cover_letter || application.message,
    proposed_price: application.proposedPrice || application.proposed_price,
    proposed_duration_days: application.proposedDurationDays || application.proposed_duration_days,
    status: application.status,
    created_at: application.createdAt || application.created_at,
    updated_at: application.updatedAt || application.updated_at
  };
}

export function formatProjectObject(project: any) {
  return {
    id: project.projectId || project.id,
    order: project.order || {
      id: project.orderId,
      title: project.orderTitle,
      description: project.orderDescription
    },
    client: project.client || {
      id: project.clientId,
      name: project.clientName,
      avatar: project.clientAvatar,
      rating: project.clientRating
    },
    master: project.master || {
      id: project.masterId,
      name: project.masterName,
      avatar: project.masterAvatar,
      rating: project.masterRating
    },
    agreed_price: project.agreedPrice || project.agreed_price,
    start_date: project.startDate || project.start_date,
    end_date: project.endDate || project.end_date,
    status: project.status,
    progress: project.progress || 0,
    created_at: project.createdAt || project.created_at,
    updated_at: project.updatedAt || project.updated_at
  };
}
