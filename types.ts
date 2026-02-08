/**
 * HandShakeMe Mobile API Types
 * Автогенерированные типы на основе backend
 * Версия: 1.0.0
 */

// ============================================
// AUTH
// ============================================

export type UserRole = 'CLIENT' | 'MASTER' | 'ADMIN';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  phone?: string;
  isVerified: boolean;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface TelegramCodeResponse {
  code: string;
  visitorId: string;
  expiresIn: number;
  sessionId: string;
}

export interface TelegramCheckResponse {
  status: 'pending' | 'confirmed' | 'expired';
  telegramId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

export interface RegisterRequest {
  telegram_id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  role: 'client' | 'master';
  phone?: string;
  citizenship?: string;
  city?: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
  message: string;
}

// ============================================
// USER
// ============================================

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type RegistrationStep = 'STARTED' | 'ROLE_SELECTED' | 'PROFILE_FILLED' | 'COMPLETED';
export type RegistrationSource = 'TELEGRAM' | 'APP' | 'WEB';

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  name?: string;
  avatar?: string;
  rating?: number;
  completedProjects?: number;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  isOnline: boolean;
  lastSeen?: string;
  telegramId?: string;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  isActive: boolean;
  city?: string;
  address?: string;
  citizenship?: string;
  birthDate?: string;
  gender?: Gender;
  isIdentityVerified: boolean;
  registrationStep?: RegistrationStep;
  registrationSource?: RegistrationSource;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  phone: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar?: string;
  is_phone_verified: boolean;
  last_seen?: string;
  created_at: string;
}

// ============================================
// MASTER PROFILE
// ============================================

export interface MasterProfile {
  profileId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  categories: number[];
  skills: number[];
  bio?: string;
  experienceYears?: number;
  hourlyRate?: string;
  dailyRate?: string;
  minOrderCost?: string;
  minOrderAmount?: string;
  maxOrderAmount?: string;
  city: string;
  address?: string;
  workRadius?: number;
  travelRadius?: number;
  hasTransport?: boolean;
  hasTools?: boolean;
  canPurchaseMaterials?: boolean;
  workingHours?: Record<string, string>;
  languages?: string[];
  certifications?: string[];
  education?: string;
  workSchedule?: string;
  isVerified: boolean;
  isAvailable: boolean;
  isPremium: boolean;
  rating: string;
  reviewsCount: number;
  completedOrders: number;
  successRate: string;
  repeatClients: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateMasterProfileRequest {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  description?: string;
  bio?: string;
  experience_years?: number | string;
  city?: string;
  address?: string;
  travel_radius?: number | string;
  has_transport?: boolean;
  has_tools?: boolean;
  can_purchase_materials?: boolean;
  hourly_rate?: number | string;
  daily_rate?: number | string;
  min_order_cost?: number | string;
  working_hours?: Record<string, string>;
  categories?: (number | string)[];
  skills?: (number | string)[];
  is_available?: boolean;
}

// ============================================
// ORDER
// ============================================

export type OrderStatus = 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BudgetType = 'FIXED' | 'RANGE' | 'NEGOTIABLE';

export interface Order {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  city: string;
  address: string;
  hideAddress: boolean;
  budgetType: BudgetType;
  budgetMin?: number;
  budgetMax?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  status: OrderStatus;
  applicationsCount: number;
  viewsCount: number;
  isUrgent: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  id: string;
  client: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
  };
  category: string;
  category_name?: string;
  subcategory?: string;
  title: string;
  description: string;
  city: string;
  address?: string;
  budget_type: BudgetType;
  budget_min?: number;
  budget_max?: number;
  status: OrderStatus;
  applications_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  category: number | string;
  categoryId?: number | string;
  subcategory?: number | string;
  required_skills?: (number | string)[];
  title: string;
  description: string;
  city: string;
  address?: string;
  hide_address?: boolean;
  budget_type?: BudgetType | Lowercase<BudgetType>;
  budget_min?: number;
  budget_max?: number;
  start_date?: string;
  end_date?: string;
  is_urgent?: boolean;
  work_volume?: string;
  floor?: number;
  has_elevator?: boolean | null;
  material_status?: string;
  has_electricity?: boolean | null;
  has_water?: boolean | null;
  can_store_tools?: boolean | null;
  has_parking?: boolean | null;
  required_experience?: string;
  need_team?: boolean;
  additional_requirements?: string;
  is_public?: boolean;
  auto_close_applications?: boolean;
}

export interface OrderSearchParams {
  search?: string;
  category?: string;
  city?: string;
  budget_min?: number;
  budget_max?: number;
  is_urgent?: boolean;
  status?: OrderStatus;
  page?: number;
  page_size?: number;
}

// ============================================
// APPLICATION
// ============================================

export type ApplicationStatus = 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'REJECTED';

export interface Application {
  id: string;
  orderId: string;
  masterId: string;
  coverLetter: string;
  proposedPrice: number;
  proposedDurationDays: number;
  status: ApplicationStatus;
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationRequest {
  orderId: string;
  coverLetter: string;
  proposedPrice: number;
  proposedDurationDays: number;
}

export interface UpdateApplicationRequest {
  coverLetter?: string;
  proposedPrice?: number;
  proposedDurationDays?: number;
}

// ============================================
// SERVICE
// ============================================

export type PriceType = 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
export type ServiceLocation = 'CLIENT_LOCATION' | 'MASTER_LOCATION' | 'REMOTE' | 'BOTH';

export interface Service {
  id: string;
  masterId: string;
  categoryId: string;
  title: string;
  description: string;
  priceType: PriceType;
  priceFrom?: number;
  priceTo?: number;
  pricePerHour?: number;
  duration?: string;
  location: ServiceLocation;
  isActive: boolean;
  isInstantBooking: boolean;
  tags: string[];
  images: string[];
  requirements?: string;
  cancellationPolicy?: string;
  orderIndex: number;
  viewsCount: number;
  ordersCount: number;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  categoryId: string;
  title: string;
  description?: string;
  priceType?: PriceType;
  priceFrom: number;
  priceTo?: number;
  pricePerHour?: number;
  duration?: string;
  location?: ServiceLocation;
  images?: string[];
  tags?: string[];
  requirements?: string;
}

// ============================================
// CHAT
// ============================================

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';

export interface ChatRoom {
  id: string;
  projectId?: string;
  participants: string[];
  lastMessageAt: string;
  lastMessage?: string;
  unreadCount: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
  isEdited: boolean;
  isRead: boolean;
  readBy: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface ChatRoomWithParticipants extends Omit<ChatRoom, 'participants'> {
  participants: Array<{
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      isOnline: boolean;
      lastSeenAt?: string;
    };
    unreadCount: number;
    lastReadAt?: string;
  }>;
  messageCount: number;
}

// WebSocket types
export type WebSocketAction = 'sendMessage' | 'editMessage' | 'deleteMessage' | 'typing' | 'markRead';

export interface WebSocketMessage {
  action: WebSocketAction;
  data: any;
}

export interface SendMessageData {
  roomId: string;
  content: string;
  type?: MessageType;
  replyToId?: string;
}

export interface TypingData {
  roomId: string;
  isTyping: boolean;
}

export interface MarkReadData {
  messageId?: string;
  roomId?: string;
}

export type BroadcastType = 'message' | 'messageEdited' | 'messageDeleted' | 'typing' | 'userOnline' | 'userOffline';

export interface BroadcastMessage {
  type: BroadcastType;
  data: any;
}

// ============================================
// NOTIFICATION
// ============================================

export type NotificationType = 'ORDER' | 'APPLICATION' | 'PROJECT' | 'REVIEW' | 'CHAT' | 'PAYMENT' | 'SYSTEM';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority?: NotificationPriority;
  createdAt: string;
  readAt?: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  newOrders: boolean;
  newApplications: boolean;
  applicationAccepted: boolean;
  applicationRejected: boolean;
  newMessages: boolean;
  projectUpdates: boolean;
  paymentReceived: boolean;
  reviewReceived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// ============================================
// REVIEW
// ============================================

export type ReviewReportReason = 'SPAM' | 'INAPPROPRIATE' | 'FAKE' | 'OFFENSIVE' | 'OTHER';

export interface Review {
  id: string;
  orderId: string;
  clientId: string;
  masterId: string;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  isVerified: boolean;
  helpfulCount: number;
  reportCount: number;
  response?: string;
  responseAt?: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  orderId: string;
  masterId: string;
  rating: number;
  comment: string;
  isAnonymous?: boolean;
  tags?: string[];
  images?: string[];
}

export interface ReviewReportRequest {
  reason: ReviewReportReason;
  description?: string;
}

// ============================================
// VERIFICATION
// ============================================

export type VerificationStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type DocumentType = 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'CERTIFICATE' | 'DIPLOMA' | 'OTHER';
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  url: string;
  fileName: string;
  uploadedAt: string;
  status: DocumentStatus;
  notes?: string;
}

export interface MasterVerification {
  id: string;
  userId: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationStatusResponse {
  id: string;
  status: Lowercase<VerificationStatus>;
  documents: Array<{
    id: string;
    type: Lowercase<DocumentType>;
    url: string;
    file_name: string;
    uploaded_at: string;
    status: Lowercase<DocumentStatus>;
    notes?: string;
  }>;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// PORTFOLIO
// ============================================

export interface PortfolioItem {
  id: string;
  masterId: string;
  title: string;
  description: string;
  images: string[];
  skills: string[];
  cost?: number;
  durationDays?: number;
  categoryId?: string;
  clientReview?: string;
  clientRating?: number;
  isPublic: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioItemRequest {
  title: string;
  description: string;
  images?: string[];
  skills?: string[];
  cost?: number;
  durationDays?: number;
  categoryId?: string;
  clientReview?: string;
  clientRating?: number;
  isPublic?: boolean;
}

// ============================================
// CATEGORY & SKILL
// ============================================

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// COMMON
// ============================================

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorResponse {
  error: ApiError;
}

export interface SuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

// ============================================
// AVAILABILITY
// ============================================

export interface WorkingHours {
  start: string;
  end: string;
  enabled: boolean;
}

export interface WeeklyWorkingHours {
  monday: WorkingHours;
  tuesday: WorkingHours;
  wednesday: WorkingHours;
  thursday: WorkingHours;
  friday: WorkingHours;
  saturday: WorkingHours;
  sunday: WorkingHours;
}

export interface AvailabilitySlot {
  id: string;
  masterId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: string;
  orderId?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// INSTANT BOOKING
// ============================================

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface InstantBooking {
  id: string;
  clientId: string;
  masterId: string;
  serviceId: string;
  scheduledDateTime: string;
  duration: number;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  baseAmount: number;
  urgentFee: number;
  platformFee: number;
  totalAmount: number;
  status: BookingStatus;
  urgentBooking: boolean;
  autoConfirmed: boolean;
  paymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}
