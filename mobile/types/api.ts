/**
 * Centralized API Types
 * Строгие типы для всех API responses
 */

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: number;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  phone?: string;
  email?: string;
  avatar?: string | null;
  role: 'client' | 'master' | 'admin';
  is_verified: boolean;
  is_phone_verified?: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  access_expires_at: string;
  refresh_expires_at: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ============================================================================
// Order Types
// ============================================================================

export interface OrderSkill {
  id: number;
  name: string;
}

export interface OrderClient {
  id: number;
  name: string;
  avatar: string | null;
  rating: string;
  phone?: string | null;
}

export interface OrderFile {
  id: number;
  file: string;
  file_url?: string;
  file_type: 'photo' | 'document' | 'video';
  thumbnail?: string;
  order_num?: number;
  uploaded_at?: string;
  created_at?: string;
}

export interface Order {
  id: number;
  title: string;
  description: string;
  category: number;
  category_name: string;
  client: OrderClient;
  client_name?: string;
  client_avatar?: string | null;
  client_rating?: string;
  client_phone?: string | null;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  budget_min?: number | string | null;
  budget_max?: number | string | null;
  budget_display?: string;
  budget_type?: 'fixed' | 'range' | 'negotiable';
  city: string;
  address?: string;
  hide_address?: boolean;
  floor?: number;
  work_volume?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_urgent?: boolean;
  has_elevator?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  can_store_tools?: boolean;
  has_parking?: boolean;
  subcategory?: number | null;
  subcategory_name?: string;
  required_skills?: number[];
  skills_list?: OrderSkill[];
  files?: OrderFile[];
  material_status?: 'client_provides' | 'master_provides' | 'master_buys' | 'need_consultation' | 'to_discuss';
  required_experience?: string | number;
  need_team?: boolean;
  additional_requirements?: string;
  is_public?: boolean;
  auto_close_applications?: boolean;
  is_favorite?: boolean;
  is_favorited?: boolean;
  has_applied?: boolean;
  application_id?: number | null;
  applications_count: number;
  views_count: number;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// Master Profile Types
// ============================================================================

export interface PortfolioImage {
  id: number;
  image: string;
  image_url?: string;
  order: number;
}

export interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  images?: PortfolioImage[];
  after_image?: string;
  media?: Array<{
    id: number;
    file: string;
    file_url?: string;
    media_type: 'photo' | 'video';
  }>;
  created_at: string;
}

export interface MasterProfile {
  id: number;
  user: User;
  user_id: number;
  user_full_name?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_avatar?: string;
  company_name?: string;
  bio?: string;
  city?: string;
  hourly_rate?: number;
  experience_years: number;
  rating?: number;
  completed_orders: number;
  completed_projects_count?: number;
  is_verified: boolean;
  is_available: boolean;
  has_transport: boolean;
  has_tools: boolean;
  portfolio_items?: PortfolioItem[];
  portfolio_preview?: PortfolioItem[];
  categories?: number[];
  skills?: number[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Application Types
// ============================================================================

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
  viewed_at?: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  averageRating: number;
  completionRate: number;
  responseTime: number;
}

export interface RevenueData {
  growth: number;
  byPeriod: Array<{
    label: string;
    value: number;
    date: string;
  }>;
}

export interface CategoryAnalytics {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface PerformanceMetrics {
  totalReviews: number;
  positiveReviews: number;
  averageResponseTime: number;
  onTimeDelivery: number;
}

export interface MasterAnalytics {
  summary: AnalyticsSummary;
  revenue: RevenueData;
  categories: CategoryAnalytics[];
  performance: PerformanceMetrics;
}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: number;
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  parent?: number | null;
  order: number;
  children?: Category[];
}

export interface Skill {
  id: number;
  name: string;
  category: number;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface AppNotification {
  id: number;
  user: number;
  type: string;
  notification_type?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at?: string;
}

// Alias для обратной совместимости
export type Notification = AppNotification;

// ============================================================================
// Project Types
// ============================================================================

export interface Milestone {
  id: number;
  project: number;
  title: string;
  description?: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'paid';
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

export interface Project {
  id: number;
  order: number;
  order_title: string;
  client: number;
  client_name: string;
  master: number;
  master_name: string;
  status: 'active' | 'completed' | 'cancelled';
  total_amount: number;
  paid_amount: number;
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: number;
  order: number;
  master: number;
  client: number;
  client_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

export interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatRoom {
  id: number;
  participants: number[];
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  room: number;
  sender: number;
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ============================================================================
// Dispute Types
// ============================================================================

export interface Dispute {
  id: number;
  order: number;
  order_title: string;
  initiator: number;
  respondent: number;
  reason: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  resolved_at?: string;
}

// ============================================================================
// Time Tracking Types
// ============================================================================

export interface TimeTrackingSession {
  id: number;
  project?: number;
  order?: number;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

export interface TimeTrackingTemplate {
  id: number;
  name: string;
  description?: string;
  default_duration?: number;
}

// ============================================================================
// Instant Booking Types
// ============================================================================

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  isUrgent?: boolean;
  price?: number;
}

export interface AvailableSlotsResponse {
  slots: TimeSlot[];
  masterInfo: {
    id: number;
    name: string;
    rating: number;
  };
  serviceInfo: {
    id: number;
    name: string;
    basePrice: number;
  };
}

// ============================================================================
// Dashboard Stats Types
// ============================================================================

export interface ClientDashboardStats {
  active_orders: number;
  completed_orders: number;
  total_spent: number;
  favorite_masters: number;
}

export interface MasterDashboardStats {
  active_orders: number;
  completed_orders: number;
  total_earned: number;
  average_rating: number;
  pending_applications: number;
  unread_messages: number;
}

// ============================================================================
// API Query Parameters
// ============================================================================

export interface OrderQueryParams {
  category?: number;
  search?: string;
  city?: string;
  budget_min?: number;
  budget_max?: number;
  is_urgent?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

export interface MasterSearchParams {
  category?: number;
  search?: string;
  city?: string;
  min_rating?: number;
  max_hourly_rate?: number;
  is_verified?: boolean;
  is_available?: boolean;
  page?: number;
  limit?: number;
}

export interface ApplicationQueryParams {
  status?: string;
  ordering?: string;
  page?: number;
  limit?: number;
}
