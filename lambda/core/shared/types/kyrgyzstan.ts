/**
 * Kyrgyzstan Types
 * Типы для кыргызстанской локализации
 */

export interface KyrgyzstanBooking {
  id: string;
  clientId: string;
  masterId: string;
  serviceId: string;
  
  datetime: string;
  duration: number; // minutes
  
  // Локальные способы оплаты
  paymentMethod: KyrgyzstanPaymentMethod;
  paymentStatus: PaymentStatus;
  
  // Гибкая система адресов
  address: KyrgyzstanAddress;
  
  // Региональные настройки
  region: KyrgyzstanRegion;
  language: KyrgyzstanLanguage;
  urgency: UrgencyLevel;
  
  // Ценообразование
  basePrice: number;
  regionalMultiplier: number;
  urgencyMultiplier: number;
  paymentMultiplier: number;
  totalPrice: number;
  commission: number;
  
  clientNotes?: string;
  status: BookingStatus;
  
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export type KyrgyzstanPaymentMethod = 
  | 'cash_on_meeting'    // Наличные при встрече (70% предпочтений)
  | 'optima_bank'        // Оптима Банк
  | 'demir_bank'         // Демир Банк  
  | 'o_money'            // O!Money (Beeline)
  | 'mega_pay'           // MegaPay (MegaCom)
  | 'crypto_usdt';       // USDT для IT-услуг

export type PaymentStatus = 
  | 'pending_meeting'    // Ожидает встречи (для наличных)
  | 'pending_payment'    // Ожидает оплаты
  | 'pending_crypto'     // Ожидает криптоплатеж
  | 'paid'               // Оплачено
  | 'failed';            // Ошибка оплаты

export interface KyrgyzstanAddress {
  type: 'exact' | 'landmark' | 'district';
  value: string;
  district?: string;
  landmark?: string;
  phoneConfirmation: boolean;
}

export type KyrgyzstanRegion = 'bishkek' | 'osh' | 'jalal_abad' | 'karakol' | 'other';

export type KyrgyzstanLanguage = 'ru' | 'ky';

export type UrgencyLevel = 'normal' | 'urgent' | 'asap';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface RegionalSettings {
  multiplier: number;
  workingHours: {
    start: number;
    end: number;
  };
  currency: string;
  timezone: string;
}

export interface KyrgyzstanOperator {
  name: string;
  prefixes: string[];
  gateway: string;
  encoding: string;
  maxLength: number;
}

export interface SMSTemplate {
  ru: string;
  ky: string;
}

export interface SMSParams {
  phoneNumber: string;
  template: string;
  language: KyrgyzstanLanguage;
  variables: Record<string, string>;
  priority?: 'normal' | 'high';
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface KyrgyzstanService {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  pricePerHour: number;
  instantBookingEnabled: boolean;
  availableRegions: KyrgyzstanRegion[];
  acceptedPaymentMethods: KyrgyzstanPaymentMethod[];
}

export interface KyrgyzstanMaster {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  avatar?: string;
  rating: number;
  responseTime: number;
  preferredLanguage: KyrgyzstanLanguage;
  workingRegions: KyrgyzstanRegion[];
  acceptedPaymentMethods: KyrgyzstanPaymentMethod[];
  notifications: {
    sms: boolean;
    push: boolean;
    email: boolean;
  };
}

export interface KyrgyzstanClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  avatar?: string;
  preferredLanguage: KyrgyzstanLanguage;
  preferredRegion: KyrgyzstanRegion;
  preferredPaymentMethod: KyrgyzstanPaymentMethod;
}

export interface AvailabilityCheck {
  isAvailable: boolean;
  reason?: string;
  alternativeSlots?: string[];
}

export interface PricingCalculation {
  basePrice: number;
  regionalMultiplier: number;
  urgencyMultiplier: number;
  paymentMultiplier: number;
  commission: number;
  total: number;
}

export interface LocalizedMessages {
  [key: string]: SMSTemplate;
}

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
}