/**
 * Applications Feature Types
 */

export type ApplicationStatus = 'pending' | 'viewed' | 'accepted' | 'rejected' | 'cancelled';

export interface ApplicationFormData {
  order: number;
  proposed_price: number;
  message: string;
  estimated_duration?: string;
  start_date?: string;
}

export interface ApplicationFiltersState {
  status?: ApplicationStatus;
  ordering?: 'created_at' | '-created_at' | 'proposed_price' | '-proposed_price';
}
