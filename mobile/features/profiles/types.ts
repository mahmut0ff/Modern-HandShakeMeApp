/**
 * Profiles Feature Types
 */

export type ProfileType = 'master' | 'client';

export interface MasterProfileFormData {
  categories?: number[];
  skills?: number[];
  bio?: string;
  experience_years?: number;
  hourly_rate?: number;
  min_order_amount?: number;
  max_order_amount?: number;
  city?: string;
  address?: string;
  work_radius?: number;
  languages?: string[];
  certifications?: string[];
  education?: string;
  work_schedule?: string;
  is_available?: boolean;
  has_transport?: boolean;
  has_tools?: boolean;
}

export interface ClientProfileFormData {
  bio?: string;
  city?: string;
  address?: string;
  company_name?: string;
  company_type?: string;
  preferred_contact_method?: 'phone' | 'chat' | 'email';
}

export interface ProfileVisibilitySettings {
  show_phone: boolean;
  show_email: boolean;
  show_address: boolean;
  show_rating: boolean;
  show_reviews: boolean;
  show_portfolio: boolean;
  is_searchable: boolean;
}
