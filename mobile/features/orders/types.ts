/**
 * Orders Feature Types
 */

export interface OrderFiltersState {
  category?: number;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  isUrgent?: boolean;
  status?: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  search?: string;
  ordering?: 'created_at' | '-created_at' | 'budget_min' | '-budget_min';
}

export interface OrderFormData {
  category: number;
  subcategory?: number;
  required_skills?: number[];
  title: string;
  description: string;
  city: string;
  address: string;
  hide_address?: boolean;
  budget_type: 'fixed' | 'range' | 'negotiable';
  budget_min?: number;
  budget_max?: number;
  start_date?: string;
  end_date?: string;
  floor?: number;
  has_elevator?: boolean | null;
  material_status?: 'client_provides' | 'master_provides' | 'master_buys' | 'need_consultation' | 'to_discuss';
  has_electricity?: boolean | null;
  has_water?: boolean | null;
  can_store_tools?: boolean | null;
  has_parking?: boolean | null;
  required_experience?: string;
  need_team?: boolean;
  additional_requirements?: string;
  is_urgent?: boolean;
  work_volume?: string;
  is_public?: boolean;
  auto_close_applications?: boolean;
}

export type OrderStatus = 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
export type BudgetType = 'fixed' | 'range' | 'negotiable';
export type MaterialStatus = 'client_provides' | 'master_provides' | 'master_buys' | 'need_consultation' | 'to_discuss';
