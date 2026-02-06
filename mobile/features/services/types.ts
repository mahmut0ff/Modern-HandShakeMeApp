/**
 * Services Feature Types
 */

export type ServiceUnit = 'hour' | 'sqm' | 'piece' | 'project' | 'day';

export interface ServiceFormData {
  name: string;
  description?: string;
  category: number;
  price_from: number;
  price_to?: number;
  unit: ServiceUnit;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface ServiceFiltersState {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  unit?: ServiceUnit;
  search?: string;
}

export const SERVICE_UNITS: { value: ServiceUnit; label: string }[] = [
  { value: 'hour', label: 'Час' },
  { value: 'sqm', label: 'м²' },
  { value: 'piece', label: 'Штука' },
  { value: 'project', label: 'Проект' },
  { value: 'day', label: 'День' },
];
