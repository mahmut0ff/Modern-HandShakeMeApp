// Mock data for testing the application

export interface MockUser {
  id: number;
  phone: string;
  role: 'client' | 'master' | 'admin';
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
  isVerified?: boolean;
  rating?: number;
  completedOrders?: number;
  specializations?: string[];
  city?: string;
}

// Test accounts for easy login
export const MOCK_USERS: MockUser[] = [
  // Client accounts
  {
    id: 1,
    phone: '+996700123456',
    role: 'client',
    firstName: 'Айгуль',
    lastName: 'Токтосунова',
    email: 'aigul@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    isVerified: true,
    city: 'Бишкек'
  },
  {
    id: 2,
    phone: '+996555987654',
    role: 'client',
    firstName: 'Максат',
    lastName: 'Жумабеков',
    email: 'maksat@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isVerified: true,
    city: 'Ош'
  },

  // Master accounts
  {
    id: 3,
    phone: '+996777111222',
    role: 'master',
    firstName: 'Бекжан',
    lastName: 'Мамытов',
    email: 'bekzhan@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    isVerified: true,
    rating: 4.8,
    completedOrders: 127,
    specializations: ['Сантехника', 'Электрика', 'Ремонт квартир'],
    city: 'Бишкек'
  },
  {
    id: 4,
    phone: '+996312555777',
    role: 'master',
    firstName: 'Нурлан',
    lastName: 'Касымов',
    email: 'nurlan@example.com',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    isVerified: true,
    rating: 4.9,
    completedOrders: 89,
    specializations: ['Строительство', 'Отделочные работы', 'Кровля'],
    city: 'Бишкек'
  },
  {
    id: 5,
    phone: '+996502333444',
    role: 'master',
    firstName: 'Гульмира',
    lastName: 'Абдылдаева',
    email: 'gulmira@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    isVerified: true,
    rating: 4.7,
    completedOrders: 156,
    specializations: ['Дизайн интерьера', 'Декор', 'Мебель на заказ'],
    city: 'Бишкек'
  },

  // Admin account
  {
    id: 6,
    phone: '+996999000111',
    role: 'admin',
    firstName: 'Админ',
    lastName: 'Системы',
    email: 'admin@handshakeme.kg',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    isVerified: true,
    city: 'Бишкек'
  }
];

// Valid verification codes for testing (any of these will work)
export const MOCK_VERIFICATION_CODES = ['1234', '0000', '1111', '9999'];

// Find user by phone number
export const findUserByPhone = (phone: string): MockUser | undefined => {
  return MOCK_USERS.find(user => user.phone === phone);
};

// Check if verification code is valid
export const isValidVerificationCode = (code: string): boolean => {
  return MOCK_VERIFICATION_CODES.includes(code);
};

// Generate mock token
export const generateMockToken = (userId: number): string => {
  return `mock-token-${userId}-${Date.now()}`;
};

// Mock orders data for testing
export const MOCK_ORDERS = [
  {
    id: 1,
    title: 'Ремонт ванной комнаты',
    description: 'Полный ремонт ванной комнаты площадью 6 кв.м',
    category: 'Сантехника',
    budget: '25000-35000',
    currency: 'сом',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
    client_id: 1,
    applications_count: 5,
    city: 'Бишкек',
    is_urgent: false
  },
  {
    id: 2,
    title: 'Установка кондиционера',
    description: 'Установка сплит-системы в спальне',
    category: 'Электрика',
    budget: '8000',
    currency: 'сом',
    status: 'in_progress',
    created_at: '2024-01-14T14:20:00Z',
    client_id: 2,
    master_id: 3,
    applications_count: 8,
    city: 'Бишкек',
    is_urgent: true
  }
];

// Mock projects data for masters
export const MOCK_PROJECTS = [
  {
    id: 1,
    title: 'Ремонт офиса',
    description: 'Косметический ремонт офисного помещения',
    status: 'completed',
    budget: '45000',
    currency: 'сом',
    client_id: 1,
    master_id: 3,
    created_at: '2024-01-10T09:00:00Z',
    completed_at: '2024-01-14T18:00:00Z',
    rating: 5
  },
  {
    id: 2,
    title: 'Установка кондиционера',
    description: 'Установка сплит-системы в спальне',
    status: 'in_progress',
    budget: '8000',
    currency: 'сом',
    client_id: 2,
    master_id: 3,
    created_at: '2024-01-14T14:20:00Z',
    progress: 75
  }
];