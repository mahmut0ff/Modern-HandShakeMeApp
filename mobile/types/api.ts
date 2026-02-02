/**
 * API Types
 * Строгая типизация для API responses
 */

export interface User {
  id: number;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  role: 'client' | 'master' | 'both';
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  title: string;
  description: string;
  category: number;
  category_name: string;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  budget_min?: string;
  budget_max?: string;
  budget_display?: string;
  city: string;
  address?: string;
  floor?: string;
  work_volume?: string;
  start_date?: string;
  end_date?: string;
  is_urgent: boolean;
  has_elevator?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  can_store_tools?: boolean;
  has_parking?: boolean;
  skills_list?: Skill[];
  files?: OrderFile[];
  applications_count: number;
  views_count: number;
  client?: User;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category?: number;
}

export interface OrderFile {
  id: number;
  file: string;
  file_url?: string;
  file_type: 'photo' | 'document';
  uploaded_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  parent?: number;
  skills_count?: number;
}

export interface MasterProfile {
  id: number;
  user: User;
  user_full_name?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_avatar?: string;
  company_name?: string;
  bio?: string;
  city?: string;
  experience_years?: number;
  hourly_rate?: number;
  rating?: number;
  completed_orders?: number;
  is_verified: boolean;
  has_transport: boolean;
  has_tools: boolean;
  portfolio_items?: PortfolioItem[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  images?: PortfolioImage[];
  created_at: string;
}

export interface PortfolioImage {
  id: number;
  image: string;
  image_url?: string;
}

export interface Application {
  id: number;
  order: number;
  order_title?: string;
  master: number;
  master_name?: string;
  message: string;
  proposed_price: number;
  estimated_duration?: string;
  status: 'pending' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  updated_at: string;
}

export interface ClientDashboardStats {
  active_orders: number;
  completed_orders: number;
  draft_orders: number;
  total_spent?: number;
  favorite_masters?: number;
}

export interface MasterDashboardStats {
  active_orders: number;
  completed_orders: number;
  total_earned?: number;
  average_rating?: number;
  pending_applications?: number;
  unread_messages?: number;
  total_reviews?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}
