# HandShakeMe Mobile API Contract

> Документ для реализации мобильного приложения мастера (marketplace: мастера + клиенты)
> Версия: 1.0.0 | Дата: 2026-02-07

---

## 1. Быстрое резюме Backend

### 1.1 Стек технологий
- **Runtime**: Node.js 18.x (AWS Lambda)
- **Language**: TypeScript
- **Database**: DynamoDB (single-table design)
- **Storage**: S3 (файлы, изображения)
- **Auth**: JWT (access + refresh tokens)
- **Realtime**: WebSocket (API Gateway WebSocket)
- **Push**: AWS SNS (iOS/Android/Web)
- **Payments**: Stripe
- **Infrastructure**: Terraform, AWS SAM

### 1.2 Основные модули
| Модуль | Описание |
|--------|----------|
| `auth` | Telegram-based аутентификация, JWT токены |
| `profiles` | User, Master, Client профили |
| `orders` | Заказы клиентов |
| `applications` | Отклики мастеров на заказы |
| `services` | Услуги мастеров |
| `chat` | REST + WebSocket чат |
| `notifications` | Push, in-app уведомления |
| `reviews` | Отзывы и рейтинги |
| `verification` | Верификация мастеров |
| `portfolio` | Портфолио работ мастера |
| `categories` | Категории и навыки |

### 1.3 Аутентификация

#### Механизм: Telegram + JWT
1. Клиент запрашивает код → `GET /auth/telegram/code?visitorId={id}`
2. Пользователь отправляет код боту в Telegram
3. Клиент проверяет статус → `GET /auth/telegram/check?sessionId={id}`
4. При успехе регистрация/логин → `POST /auth/telegram/register`
5. Получает пару токенов (access + refresh)

#### Токены
| Тип | Срок жизни | Использование |
|-----|------------|---------------|
| Access Token | 1 час | `Authorization: Bearer {token}` |
| Refresh Token | 7 дней | `POST /auth/refresh` |

#### JWT Payload
```typescript
interface TokenPayload {
  userId: string;
  email: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  phone?: string;
  isVerified: boolean;
  type: 'access' | 'refresh';
}
```

### 1.4 Роли и доступ

| Роль | Описание | Возможности |
|------|----------|-------------|
| `CLIENT` | Заказчик | Создание заказов, выбор мастера, оплата |
| `MASTER` | Исполнитель | Отклики на заказы, услуги, портфолио |
| `ADMIN` | Администратор | Полный доступ, модерация |

#### Статусы верификации мастера
- `PENDING` - Ожидает загрузки документов
- `IN_REVIEW` - На проверке
- `APPROVED` - Верифицирован ✓
- `REJECTED` - Отклонен
- `SUSPENDED` - Приостановлен

---

## 2. Доменные сущности (Data Model)

### 2.1 User
```typescript
interface User {
  id: string;                    // UUID
  phone: string;                 // Телефон (может быть tg_{telegramId})
  email?: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  firstName: string;             // Обязательно
  lastName: string;
  avatar?: string;               // URL
  rating?: number;               // Для мастеров (1-5)
  completedProjects?: number;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  isOnline: boolean;
  lastSeen?: string;             // ISO datetime
  telegramId?: string;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  isActive: boolean;
  city?: string;
  citizenship?: string;          // KG, RU, KZ...
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  isIdentityVerified: boolean;
  registrationStep?: 'STARTED' | 'ROLE_SELECTED' | 'PROFILE_FILLED' | 'COMPLETED';
  createdAt: string;             // ISO datetime
  updatedAt: string;
}
```

### 2.2 MasterProfile
```typescript
interface MasterProfile {
  profileId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  categories: number[];          // ID категорий
  skills: number[];              // ID навыков
  bio?: string;                  // Описание (до 2000 символов)
  experienceYears?: number;
  hourlyRate?: string;           // Строка для гибкости
  dailyRate?: string;
  minOrderCost?: string;
  city: string;
  address?: string;
  workRadius?: number;           // км
  travelRadius?: number;
  hasTransport?: boolean;
  hasTools?: boolean;
  canPurchaseMaterials?: boolean;
  workingHours?: Record<string, string>;
  languages?: string[];
  certifications?: string[];
  isVerified: boolean;
  isAvailable: boolean;
  isPremium: boolean;
  rating: string;                // "4.5"
  reviewsCount: number;
  completedOrders: number;
  successRate: string;           // "95"
  repeatClients: number;
  createdAt: string;
  updatedAt?: string;
}
```

### 2.3 Order
```typescript
interface Order {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;                 // 5-200 символов
  description: string;           // 20-5000 символов
  city: string;
  address: string;
  hideAddress: boolean;          // Скрыть адрес от мастеров
  budgetType: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
  budgetMin?: number;
  budgetMax?: number;
  startDate?: string;            // ISO date
  endDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  applicationsCount: number;
  viewsCount: number;
  isUrgent: boolean;
  expiresAt: string;             // По умолчанию +30 дней
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 Application (Отклик мастера)
```typescript
interface Application {
  id: string;
  orderId: string;
  masterId: string;
  coverLetter: string;           // 50-2000 символов
  proposedPrice: number;         // > 0
  proposedDurationDays: number;  // > 0
  status: 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'REJECTED';
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.5 Service (Услуга мастера)
```typescript
interface Service {
  id: string;
  masterId: string;
  categoryId: string;
  title: string;                 // 3-100 символов
  description: string;           // 10-500 символов
  priceType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  priceFrom?: number;
  priceTo?: number;
  pricePerHour?: number;
  duration?: string;
  location: 'CLIENT_LOCATION' | 'MASTER_LOCATION' | 'REMOTE' | 'BOTH';
  isActive: boolean;
  isInstantBooking: boolean;
  tags: string[];
  images: string[];              // URLs
  requirements?: string;
  cancellationPolicy?: string;
  orderIndex: number;            // Для сортировки
  viewsCount: number;
  ordersCount: number;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 2.6 ChatRoom & Message
```typescript
interface ChatRoom {
  id: string;
  projectId?: string;
  participants: string[];        // userIds
  lastMessageAt: string;
  lastMessage?: string;
  unreadCount: Record<string, number>; // userId -> count
  createdAt: string;
  updatedAt?: string;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
  isEdited: boolean;
  isRead: boolean;
  readBy: Record<string, string>; // userId -> timestamp
  createdAt: string;
  updatedAt?: string;
}
```

### 2.7 Notification
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'ORDER' | 'APPLICATION' | 'PROJECT' | 'REVIEW' | 'CHAT' | 'PAYMENT' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, any>;    // Дополнительные данные для навигации
  isRead: boolean;
  priority?: 'low' | 'normal' | 'high';
  createdAt: string;
  readAt?: string;
}
```

### 2.8 Review
```typescript
interface Review {
  id: string;
  orderId: string;
  clientId: string;
  masterId: string;
  rating: number;                // 1-5
  comment: string;
  isAnonymous: boolean;
  isVerified: boolean;           // Подтвержденный заказ
  helpfulCount: number;
  reportCount: number;
  response?: string;             // Ответ мастера
  responseAt?: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 2.9 Verification
```typescript
interface MasterVerification {
  id: string;
  userId: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  documents: VerificationDocument[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface VerificationDocument {
  id: string;
  type: 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'CERTIFICATE' | 'DIPLOMA' | 'OTHER';
  url: string;
  fileName: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}
```

### 2.10 Portfolio
```typescript
interface PortfolioItem {
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
```

---

## 3. API Контракт

### Общие правила
- **Base URL**: `https://api.handshakeme.com/v1` (production)
- **Content-Type**: `application/json`
- **Authorization**: `Bearer {accessToken}` (кроме публичных endpoints)
- **Локализация**: `Accept-Language: ru|ky|en`

### Формат ответов

#### Успешный ответ
```json
{
  "data": { ... },
  "message": "Success"
}
```

#### Пагинированный ответ
```json
{
  "results": [...],
  "count": 100,
  "next": "?page=2",
  "previous": null
}
```

#### Ошибка
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...]
  }
}
```

### Коды ошибок
| HTTP | Код | Описание |
|------|-----|----------|
| 400 | `VALIDATION_ERROR` | Ошибка валидации |
| 400 | `BAD_REQUEST` | Некорректный запрос |
| 401 | `UNAUTHORIZED` | Требуется авторизация |
| 401 | `TOKEN_EXPIRED` | Токен истек |
| 403 | `FORBIDDEN` | Доступ запрещен |
| 404 | `NOT_FOUND` | Ресурс не найден |
| 409 | `CONFLICT` | Конфликт (дубликат) |
| 429 | `RATE_LIMIT` | Превышен лимит запросов |
| 500 | `INTERNAL_ERROR` | Внутренняя ошибка |

---

### 3.1 Аутентификация

#### `GET /auth/telegram/code`
Генерация кода для Telegram-авторизации.

**Query params:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `visitorId` | string | ✓ | Уникальный ID устройства/сессии |

**Response 200:**
```json
{
  "code": "1234",
  "visitorId": "device-uuid",
  "expiresIn": 600,
  "sessionId": "session-uuid"
}
```

---

#### `GET /auth/telegram/check`
Проверка статуса авторизации.

**Query params:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `sessionId` | string | ✓ | ID сессии из /code |

**Response 200 (pending):**
```json
{
  "status": "pending",
  "message": "Waiting for Telegram confirmation"
}
```

**Response 200 (confirmed):**
```json
{
  "status": "confirmed",
  "telegramId": "123456789",
  "firstName": "Иван",
  "lastName": "Иванов",
  "username": "ivanov",
  "photoUrl": "https://..."
}
```

---

#### `POST /auth/telegram/register`
Регистрация/логин через Telegram.

**Request body:**
```json
{
  "telegram_id": "123456789",
  "first_name": "Иван",
  "last_name": "Иванов",
  "username": "ivanov",
  "photo_url": "https://...",
  "role": "master",
  "phone": "+996555123456",
  "citizenship": "KG",
  "city": "Бишкек"
}
```

**Response 200:**
```json
{
  "tokens": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  },
  "user": {
    "id": "user-uuid",
    "phone": "+996555123456",
    "role": "MASTER",
    "firstName": "Иван",
    "lastName": "Иванов",
    "telegramId": "123456789",
    "avatar": "https://...",
    "isPhoneVerified": false,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "Registration successful"
}
```

**Ошибки:**
- `400` - User with this Telegram ID already exists

---

#### `POST /auth/refresh`
Обновление токенов.

**Request body:**
```json
{
  "refreshToken": "eyJ..."
}
```
*Альтернативно: `{ "refresh": "eyJ..." }`*

**Response 200:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": "user-uuid",
    "phone": "+996555123456",
    "role": "MASTER",
    "firstName": "Иван",
    "lastName": "Иванов",
    "fullName": "Иван Иванов"
  }
}
```

**Ошибки:**
- `401` - Invalid or expired refresh token

---

#### `POST /auth/logout` 🔒
Выход из системы.

**Request body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

---

### 3.2 Профиль пользователя

#### `GET /users/me` 🔒
Получение текущего пользователя.

**Response 200:**
```json
{
  "id": "user-uuid",
  "phone": "+996555123456",
  "role": "MASTER",
  "first_name": "Иван",
  "last_name": "Иванов",
  "full_name": "Иван Иванов",
  "avatar": "https://...",
  "is_phone_verified": true,
  "last_seen": "2024-01-01T12:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### `PUT /users/me` 🔒
Обновление профиля.

**Request body:**
```json
{
  "firstName": "Иван",
  "lastName": "Иванов",
  "city": "Бишкек",
  "phone": "+996555123456"
}
```

---

### 3.3 Профиль мастера

#### `GET /masters/me` 🔒 (MASTER)
Получение профиля мастера.

**Response 200:**
```json
{
  "profileId": "profile-uuid",
  "userId": "user-uuid",
  "categories": [1, 2, 3],
  "skills": [10, 11, 12],
  "bio": "Опытный мастер...",
  "experienceYears": 5,
  "hourlyRate": "500",
  "city": "Бишкек",
  "travelRadius": 20,
  "hasTransport": true,
  "hasTools": true,
  "isVerified": false,
  "isAvailable": true,
  "rating": "4.8",
  "reviewsCount": 25,
  "completedOrders": 50,
  "user": {
    "id": "user-uuid",
    "first_name": "Иван",
    "last_name": "Иванов",
    "avatar": "https://..."
  }
}
```

---

#### `PUT /masters/me` 🔒 (MASTER)
Обновление профиля мастера.

**Request body:**
```json
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "company_name": "ИП Иванов",
  "bio": "Опытный мастер с 5-летним стажем...",
  "experience_years": 5,
  "city": "Бишкек",
  "address": "ул. Московская 123",
  "travel_radius": 20,
  "has_transport": true,
  "has_tools": true,
  "can_purchase_materials": true,
  "hourly_rate": 500,
  "daily_rate": 3000,
  "min_order_cost": 1000,
  "categories": [1, 2],
  "skills": [10, 11, 12],
  "is_available": true,
  "working_hours": {
    "monday": "09:00-18:00",
    "tuesday": "09:00-18:00"
  }
}
```

---

#### `GET /masters` 
Список мастеров (публичный).

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `city` | string | Фильтр по городу |
| `category_id` | number | Фильтр по категории |
| `min_rating` | number | Минимальный рейтинг |
| `is_verified` | boolean | Только верифицированные |
| `is_available` | boolean | Только доступные |
| `page` | number | Страница (default: 1) |
| `page_size` | number | Размер страницы (default: 20) |

---

#### `GET /masters/search`
Поиск мастеров.

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `query` | string | Поисковый запрос |
| `city` | string | Город |
| `category` | number | Категория |
| `skill` | number | Навык |

---

#### `GET /masters/:masterId`
Профиль мастера (публичный).

**Response 200:**
```json
{
  "profileId": "profile-uuid",
  "userId": "user-uuid",
  "firstName": "Иван",
  "lastName": "Иванов",
  "bio": "...",
  "rating": "4.8",
  "reviewsCount": 25,
  "completedOrders": 50,
  "isVerified": true,
  "isAvailable": true
}
```

---

#### `GET /masters/:masterId/reviews`
Отзывы о мастере.

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `rating` | number | Фильтр по рейтингу (1-5) |
| `page` | number | Страница |
| `page_size` | number | Размер страницы |

---

### 3.4 Категории и навыки

#### `GET /categories`
Список категорий.

**Response 200:**
```json
{
  "results": [
    {
      "id": "1",
      "name": "Ремонт квартир",
      "icon": "🔧",
      "order": 1,
      "isActive": true
    }
  ],
  "count": 15
}
```

---

#### `GET /categories/:categoryId/skills`
Навыки категории.

**Response 200:**
```json
{
  "results": [
    {
      "id": "10",
      "name": "Штукатурка",
      "categoryId": "1",
      "isActive": true
    }
  ]
}
```

---

#### `GET /skills`
Все навыки.

---

### 3.5 Услуги мастера

#### `GET /services/my` 🔒 (MASTER)
Мои услуги.

---

#### `POST /services` 🔒 (MASTER)
Создание услуги.

**Request body:**
```json
{
  "categoryId": "1",
  "title": "Укладка плитки",
  "description": "Профессиональная укладка плитки любой сложности",
  "priceType": "FIXED",
  "priceFrom": 500,
  "priceTo": 800,
  "duration": "1-2 дня",
  "location": "CLIENT_LOCATION",
  "images": ["https://..."],
  "tags": ["плитка", "ванная"]
}
```

**Валидация:**
- `title`: 3-100 символов
- `description`: 10-500 символов
- `priceFrom`: > 0
- `priceTo`: >= priceFrom (если указано)

---

#### `PUT /services/:serviceId` 🔒 (MASTER)
Обновление услуги.

---

#### `DELETE /services/:serviceId` 🔒 (MASTER)
Удаление услуги.

---

### 3.6 Заказы

#### `GET /orders`
Список активных заказов (лента для мастера).

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `status` | string | Статус (default: ACTIVE) |
| `categoryId` | string | Категория |
| `limit` | number | Лимит (default: 20) |
| `page` | number | Страница |

**Response 200:**
```json
{
  "results": [
    {
      "id": "order-uuid",
      "client": {
        "id": "client-uuid",
        "name": "Клиент",
        "avatar": "https://...",
        "rating": 4.5
      },
      "category": "1",
      "category_name": "Ремонт квартир",
      "title": "Ремонт ванной комнаты",
      "description": "Нужен полный ремонт...",
      "city": "Бишкек",
      "budget_type": "RANGE",
      "budget_min": 50000,
      "budget_max": 80000,
      "status": "ACTIVE",
      "applications_count": 5,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 100,
  "next": "?page=2",
  "previous": null
}
```

---

#### `GET /orders/search`
Поиск заказов.

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `search` | string | Текстовый поиск |
| `category` | string | Категория |
| `city` | string | Город |
| `budget_min` | number | Мин. бюджет |
| `budget_max` | number | Макс. бюджет |
| `is_urgent` | boolean | Только срочные |
| `status` | string | Статус (default: ACTIVE) |
| `page` | number | Страница |
| `page_size` | number | Размер (default: 20) |

---

#### `GET /orders/my` 🔒 (CLIENT)
Мои заказы (для клиента).

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `status` | string | Фильтр по статусу |

---

#### `GET /orders/recommended` 🔒 (MASTER)
Рекомендованные заказы для мастера.

---

#### `POST /orders` 🔒 (CLIENT)
Создание заказа.

**Request body:**
```json
{
  "category": 1,
  "subcategory": 10,
  "required_skills": [10, 11],
  "title": "Ремонт ванной комнаты",
  "description": "Нужен полный ремонт ванной комнаты 6 кв.м...",
  "city": "Бишкек",
  "address": "ул. Московская 123",
  "hide_address": true,
  "budget_type": "RANGE",
  "budget_min": 50000,
  "budget_max": 80000,
  "start_date": "2024-02-01",
  "end_date": "2024-02-15",
  "is_urgent": false,
  "work_volume": "6 кв.м",
  "floor": 3,
  "has_elevator": true,
  "material_status": "need_purchase",
  "has_electricity": true,
  "has_water": true,
  "can_store_tools": true,
  "has_parking": false,
  "required_experience": "3+ лет",
  "need_team": false,
  "additional_requirements": "Желательно с портфолио"
}
```

**Валидация:**
- `title`: 5-200 символов
- `description`: 20-5000 символов
- `category` или `categoryId`: обязательно

---

#### `GET /orders/:orderId`
Детали заказа.

---

#### `PUT /orders/:orderId` 🔒 (CLIENT, owner)
Обновление заказа.

---

#### `DELETE /orders/:orderId` 🔒 (CLIENT, owner)
Удаление заказа.

---

#### `POST /orders/:orderId/favorites` 🔒
Добавить в избранное.

---

#### `DELETE /orders/:orderId/favorites` 🔒
Удалить из избранного.

---

#### `GET /orders/:orderId/applications` 🔒 (CLIENT, owner)
Отклики на заказ.

---

### 3.7 Отклики (Applications)

#### `GET /applications/my` 🔒 (MASTER)
Мои отклики.

**Response 200:**
```json
{
  "results": [
    {
      "id": "app-uuid",
      "orderId": "order-uuid",
      "masterId": "master-uuid",
      "coverLetter": "Готов выполнить работу...",
      "proposedPrice": 60000,
      "proposedDurationDays": 10,
      "status": "PENDING",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### `POST /applications` 🔒 (MASTER)
Создание отклика.

**Request body:**
```json
{
  "orderId": "order-uuid",
  "coverLetter": "Здравствуйте! Готов выполнить работу качественно и в срок...",
  "proposedPrice": 60000,
  "proposedDurationDays": 10
}
```

**Валидация:**
- `coverLetter`: 50-2000 символов
- `proposedPrice`: > 0
- `proposedDurationDays`: > 0

**Ошибки:**
- `400` - Order is not active
- `400` - You have already applied to this order
- `404` - Order not found

---

#### `GET /applications/:applicationId` 🔒
Детали отклика.

---

#### `PUT /applications/:applicationId` 🔒 (MASTER, owner)
Обновление отклика.

**Request body:**
```json
{
  "coverLetter": "Обновленное сопроводительное письмо...",
  "proposedPrice": 55000,
  "proposedDurationDays": 8
}
```

---

#### `DELETE /applications/:applicationId` 🔒 (MASTER, owner)
Удаление отклика.

---

#### `POST /applications/:applicationId/accept` 🔒 (CLIENT)
Принять отклик (создает проект).

---

#### `POST /applications/:applicationId/respond` 🔒 (CLIENT)
Ответить на отклик (принять/отклонить).

**Request body:**
```json
{
  "action": "accept" | "reject",
  "message": "Опциональное сообщение"
}
```

---

#### `POST /applications/:applicationId/view` 🔒 (CLIENT)
Отметить отклик как просмотренный.

---

### 3.8 Отзывы

#### `GET /reviews/my` 🔒
Мои отзывы (полученные для мастера, оставленные для клиента).

---

#### `POST /reviews` 🔒 (CLIENT)
Создание отзыва.

**Request body:**
```json
{
  "orderId": "order-uuid",
  "masterId": "master-uuid",
  "rating": 5,
  "comment": "Отличная работа! Рекомендую.",
  "isAnonymous": false,
  "tags": ["качество", "сроки"],
  "images": ["https://..."]
}
```

---

#### `POST /reviews/:reviewId/respond` 🔒 (MASTER)
Ответ на отзыв.

**Request body:**
```json
{
  "response": "Спасибо за отзыв! Рад, что вам понравилось."
}
```

---

#### `POST /reviews/:reviewId/helpful` 🔒
Отметить отзыв как полезный.

---

#### `POST /reviews/:reviewId/report` 🔒
Пожаловаться на отзыв.

**Request body:**
```json
{
  "reason": "SPAM" | "INAPPROPRIATE" | "FAKE" | "OFFENSIVE" | "OTHER",
  "description": "Описание проблемы"
}
```

---

### 3.10 Чат

#### `GET /chat/rooms` 🔒
Список чатов.

**Response 200:**
```json
{
  "results": [
    {
      "id": "room-uuid",
      "projectId": "project-uuid",
      "participants": [
        {
          "userId": "user-uuid",
          "user": {
            "id": "user-uuid",
            "firstName": "Иван",
            "lastName": "Иванов",
            "avatar": "https://...",
            "isOnline": true,
            "lastSeenAt": "2024-01-01T12:00:00Z"
          },
          "unreadCount": 3,
          "lastReadAt": "2024-01-01T11:00:00Z"
        }
      ],
      "lastMessageAt": "2024-01-01T12:00:00Z",
      "lastMessage": "Привет!",
      "messageCount": 50
    }
  ]
}
```

---

#### `POST /chat/rooms` 🔒
Создание чата.

**Request body:**
```json
{
  "participants": ["user-uuid-1", "user-uuid-2"],
  "projectId": "project-uuid"
}
```

---

#### `GET /chat/rooms/:roomId` 🔒
Детали чата.

---

#### `GET /chat/rooms/:roomId/messages` 🔒
История сообщений.

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `limit` | number | Лимит (default: 50) |
| `lastMessageId` | string | Для пагинации (cursor) |

**Response 200:**
```json
{
  "results": [
    {
      "id": "msg-uuid",
      "roomId": "room-uuid",
      "senderId": "user-uuid",
      "type": "TEXT",
      "content": "Привет!",
      "isEdited": false,
      "isRead": true,
      "readBy": {
        "user-uuid-2": "2024-01-01T12:01:00Z"
      },
      "createdAt": "2024-01-01T12:00:00Z",
      "sender": {
        "id": "user-uuid",
        "firstName": "Иван",
        "lastName": "Иванов",
        "avatar": "https://..."
      }
    }
  ]
}
```

---

#### `POST /chat/rooms/:roomId/messages` 🔒
Отправка сообщения (REST fallback).

**Request body:**
```json
{
  "content": "Привет!",
  "type": "TEXT",
  "replyToId": "msg-uuid"
}
```

---

#### `POST /chat/rooms/:roomId/image` 🔒
Отправка изображения.

**Content-Type**: `multipart/form-data`

---

#### `POST /chat/rooms/:roomId/read` 🔒
Отметить чат как прочитанный.

---

### 3.11 Уведомления

#### `GET /notifications` 🔒
Список уведомлений.

**Response 200:**
```json
{
  "notifications": [
    {
      "id": "notif-uuid",
      "type": "APPLICATION",
      "title": "Новый отклик",
      "message": "Мастер Иван откликнулся на ваш заказ",
      "data": {
        "applicationId": "app-uuid",
        "orderId": "order-uuid"
      },
      "isRead": false,
      "priority": "normal",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 50,
  "unreadCount": 5
}
```

---

#### `GET /notifications/unread-count` 🔒
Количество непрочитанных.

**Response 200:**
```json
{
  "count": 5
}
```

---

#### `POST /notifications/:notificationId/read` 🔒
Отметить как прочитанное.

---

#### `POST /notifications/read-all` 🔒
Отметить все как прочитанные.

---

#### `DELETE /notifications/:notificationId` 🔒
Удалить уведомление.

---

#### `DELETE /notifications` 🔒
Удалить все уведомления.

---

#### `GET /notifications/settings` 🔒
Настройки уведомлений.

**Response 200:**
```json
{
  "pushEnabled": true,
  "emailEnabled": true,
  "smsEnabled": false,
  "newOrders": true,
  "newApplications": true,
  "applicationAccepted": true,
  "applicationRejected": true,
  "newMessages": true,
  "projectUpdates": true,
  "paymentReceived": true,
  "reviewReceived": true
}
```

---

#### `PUT /notifications/settings` 🔒
Обновление настроек.

---

### 3.12 Верификация мастера

#### `GET /verification/status` 🔒 (MASTER)
Статус верификации.

**Response 200:**
```json
{
  "id": "verif-uuid",
  "status": "pending",
  "documents": [
    {
      "id": "doc-uuid",
      "type": "passport",
      "url": "https://...",
      "file_name": "passport.jpg",
      "uploaded_at": "2024-01-01T00:00:00Z",
      "status": "pending",
      "notes": null
    }
  ],
  "notes": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "verified_at": null,
  "rejection_reason": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### `GET /verification/requirements` 🔒 (MASTER)
Требования для верификации.

---

#### `POST /verification/documents` 🔒 (MASTER)
Загрузка документа.

**Content-Type**: `multipart/form-data` или `application/octet-stream`

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `document_type` | string | PASSPORT, ID_CARD, DRIVER_LICENSE, CERTIFICATE, DIPLOMA, OTHER |
| `document_number` | string | Номер документа (опционально) |
| `description` | string | Описание (опционально) |

**Ограничения:**
- Максимальный размер: 10 MB
- Форматы: jpg, png, pdf, webp

**Response 200:**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": "doc-uuid",
    "type": "passport",
    "url": "https://...",
    "file_name": "passport.jpg",
    "status": "pending",
    "uploaded_at": "2024-01-01T00:00:00Z"
  },
  "verification_status": "pending",
  "total_documents": 2
}
```

---

#### `POST /verification/submit` 🔒 (MASTER)
Отправить на проверку.

**Требования:**
- Минимум 1 документ типа PASSPORT, ID_CARD или DRIVER_LICENSE

---

### 3.13 Портфолио

#### `GET /portfolio` 🔒 (MASTER)
Мое портфолио.

**Query params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `categoryId` | string | Фильтр по категории |
| `sortBy` | string | recent, popular, rating |
| `page` | number | Страница |
| `pageSize` | number | Размер страницы |

---

#### `POST /portfolio` 🔒 (MASTER)
Добавление работы.

**Request body:**
```json
{
  "title": "Ремонт ванной комнаты",
  "description": "Полный ремонт ванной комнаты под ключ...",
  "images": ["https://..."],
  "skills": ["плитка", "сантехника"],
  "cost": 80000,
  "durationDays": 14,
  "categoryId": "1",
  "clientReview": "Отличная работа!",
  "clientRating": 5,
  "isPublic": true
}
```

---

#### `PUT /portfolio/:itemId` 🔒 (MASTER)
Обновление работы.

---

#### `DELETE /portfolio/:itemId` 🔒 (MASTER)
Удаление работы.

---

### 3.14 Дополнительные эндпоинты

#### Доступность мастера
- `GET /availability` - Расписание
- `PUT /availability` - Обновление расписания
- `GET /availability/slots` - Доступные слоты
- `POST /availability/book` - Бронирование слота

#### Мгновенное бронирование
- `GET /instant-booking/slots` - Доступные слоты
- `POST /instant-booking` - Создание бронирования
- `GET /instant-booking` - Список бронирований
- `PUT /instant-booking/:bookingId` - Управление бронированием

#### Отслеживание времени
- `GET /time-tracking/sessions` - Сессии
- `POST /time-tracking/sessions` - Управление сессиями
- `GET /time-tracking/active` - Активная сессия
- `GET /time-tracking/statistics` - Статистика

#### Аналитика
- `GET /analytics/orders` - Аналитика заказов
- `GET /analytics/master` - Аналитика мастера

#### GDPR
- `GET /gdpr/export` - Экспорт данных
- `DELETE /gdpr/account` - Удаление аккаунта

---

## 4. WebSocket (Realtime)

### 4.1 Подключение

**URL**: `wss://ws.handshakeme.com`

**Handshake**: Авторизация через query parameter или header
```
wss://ws.handshakeme.com?token={accessToken}
```

### 4.2 События от клиента

#### Отправка сообщения
```json
{
  "action": "sendMessage",
  "data": {
    "roomId": "room-uuid",
    "content": "Привет!",
    "type": "TEXT",
    "replyToId": "msg-uuid"
  }
}
```

#### Индикатор набора
```json
{
  "action": "typing",
  "data": {
    "roomId": "room-uuid",
    "isTyping": true
  }
}
```

#### Отметка прочтения
```json
{
  "action": "markRead",
  "data": {
    "roomId": "room-uuid",
    "messageId": "msg-uuid"
  }
}
```

### 4.3 События от сервера

#### Новое сообщение
```json
{
  "type": "message",
  "data": {
    "id": "msg-uuid",
    "roomId": "room-uuid",
    "senderId": "user-uuid",
    "type": "TEXT",
    "content": "Привет!",
    "createdAt": "2024-01-01T12:00:00Z",
    "sender": {
      "id": "user-uuid",
      "firstName": "Иван",
      "lastName": "Иванов",
      "avatar": "https://..."
    }
  }
}
```

#### Индикатор набора
```json
{
  "type": "typing",
  "data": {
    "roomId": "room-uuid",
    "userId": "user-uuid",
    "isTyping": true
  }
}
```

#### Статус пользователя
```json
{
  "type": "userOnline",
  "data": {
    "userId": "user-uuid",
    "isOnline": true
  }
}
```

### 4.4 Reconnect стратегия

```typescript
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];

function reconnect(attempt: number) {
  const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
  setTimeout(() => connect(), delay);
}
```

### 4.5 Heartbeat

- Клиент отправляет ping каждые 30 секунд
- Сервер обновляет TTL соединения (30 минут)
- При отсутствии ping соединение автоматически закрывается

---

## 5. UX Флоу мобильного приложения мастера

### 5.1 Онбординг / Логин

```
┌─────────────────┐
│   Splash Screen │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Welcome Screen │────▶│ Telegram Auth   │
│  (Выбор роли)   │     │ (Код + бот)     │
└─────────────────┘     └────────┬────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│ Регистрация     │                             │ Главная         │
│ (Заполнение     │                             │ (Существующий   │
│  профиля)       │                             │  пользователь)  │
└────────┬────────┘                             └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Выбор категорий │
│ и навыков       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Главная мастера │
└─────────────────┘
```

**Endpoints:**
- `GET /auth/telegram/code`
- `GET /auth/telegram/check` (polling)
- `POST /auth/telegram/register`
- `GET /categories`
- `PUT /masters/me`

### 5.2 Главная мастера

**Экран**: Dashboard с метриками и быстрыми действиями

**Данные:**
- Статистика: `GET /masters/me/dashboard-stats`
- Новые заказы: `GET /orders?status=ACTIVE&limit=5`
- Мои отклики: `GET /applications/my`
- Непрочитанные: `GET /notifications/unread-count`

**Кэш:**
- Dashboard stats: 5 минут
- Orders: 1 минута
- Инвалидация: при создании отклика, получении уведомления

### 5.3 Профиль мастера

**Экран**: Редактирование профиля

**Endpoints:**
- `GET /masters/me`
- `PUT /masters/me`
- `POST /users/avatar` (multipart)
- `DELETE /users/avatar`
- `GET /categories`
- `GET /categories/:id/skills`

**Состояния:**
- Loading
- Error (сеть, валидация)
- Success (toast)

### 5.4 Мои услуги

**Экран**: CRUD услуг мастера

**Endpoints:**
- `GET /services/my`
- `POST /services`
- `PUT /services/:id`
- `DELETE /services/:id`

**Кэш:**
- Локальный список услуг
- Инвалидация: при CRUD операциях

### 5.5 Лента заказов

**Экран**: Список заказов с фильтрами

**Endpoints:**
- `GET /orders/search`
- `GET /orders/recommended`
- `POST /orders/:id/favorites`
- `DELETE /orders/:id/favorites`

**Фильтры:**
- Категория
- Город
- Бюджет (min/max)
- Срочность
- Текстовый поиск

**Пагинация:**
- Infinite scroll
- `page` + `page_size`
- Cursor-based для чатов

### 5.6 Карточка заказа

**Экран**: Детали заказа + действия

**Endpoints:**
- `GET /orders/:id`
- `POST /applications` (создать отклик)

**Действия:**
- Откликнуться
- Добавить в избранное
- Поделиться
- Связаться с клиентом (если есть проект)

### 5.7 Мои отклики

**Экран**: Список откликов со статусами

**Endpoints:**
- `GET /applications/my`
- `PUT /applications/:id`
- `DELETE /applications/:id`

**Статусы:**
- PENDING - Ожидает
- VIEWED - Просмотрен
- ACCEPTED - Принят ✓
- REJECTED - Отклонен ✗

### 5.8 Чат

**Экран**: Список чатов + переписка

**Endpoints (REST):**
- `GET /chat/rooms`
- `GET /chat/rooms/:id/messages`
- `POST /chat/rooms/:id/messages`
- `POST /chat/rooms/:id/read`

**WebSocket:**
- Подключение при входе в чат
- События: message, typing, userOnline

**Кэш:**
- Список чатов: 30 секунд
- Сообщения: локальный кэш + sync

### 5.9 Уведомления

**Экран**: Список уведомлений

**Endpoints:**
- `GET /notifications`
- `POST /notifications/:id/read`
- `POST /notifications/read-all`
- `DELETE /notifications/:id`

**Push:**
- Регистрация токена при старте
- Обработка deep links

### 5.10 Отзывы

**Экран**: Полученные отзывы + ответы

**Endpoints:**
- `GET /masters/:id/reviews`
- `POST /reviews/:id/respond`

### 5.11 Верификация

**Экран**: Статус + загрузка документов

**Endpoints:**
- `GET /verification/status`
- `GET /verification/requirements`
- `POST /verification/documents`
- `POST /verification/submit`

---

## 6. Нормы и соглашения для клиента

### 6.1 HTTP Client (Axios)

```typescript
import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const api = axios.create({
  baseURL: 'https://api.handshakeme.com/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'ru',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = storage.getString('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = storage.getString('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/auth/refresh', { refreshToken });
          storage.set('accessToken', data.access);
          storage.set('refreshToken', data.refresh);
          error.config.headers.Authorization = `Bearer ${data.access}`;
          return api.request(error.config);
        } catch {
          // Logout
          storage.delete('accessToken');
          storage.delete('refreshToken');
          // Navigate to login
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### 6.2 Обработка ошибок

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
}

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Проверьте введенные данные',
  UNAUTHORIZED: 'Необходима авторизация',
  TOKEN_EXPIRED: 'Сессия истекла',
  FORBIDDEN: 'Доступ запрещен',
  NOT_FOUND: 'Не найдено',
  CONFLICT: 'Конфликт данных',
  RATE_LIMIT: 'Слишком много запросов',
  INTERNAL_ERROR: 'Ошибка сервера',
  NETWORK_ERROR: 'Проверьте подключение к интернету',
};

function handleApiError(error: AxiosError): string {
  if (!error.response) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  const apiError = error.response.data?.error as ApiError;
  return ERROR_MESSAGES[apiError?.code] || apiError?.message || 'Неизвестная ошибка';
}
```

### 6.3 Пагинация / Infinite Scroll

```typescript
interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

function usePaginatedQuery<T>(
  queryKey: string[],
  fetcher: (page: number) => Promise<PaginatedResponse<T>>
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetcher(pageParam),
    getNextPageParam: (lastPage, pages) => 
      lastPage.next ? pages.length + 1 : undefined,
  });
}
```

### 6.4 Формат дат / Таймзоны

```typescript
// Все даты приходят в ISO 8601 UTC
// Отображение в локальной таймзоне

import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'd MMMM yyyy', { locale: ru });
}

function formatDateTime(isoString: string): string {
  return format(parseISO(isoString), 'd MMM, HH:mm', { locale: ru });
}

function formatRelative(isoString: string): string {
  // "5 минут назад", "вчера", "2 дня назад"
  return formatDistanceToNow(parseISO(isoString), { 
    addSuffix: true, 
    locale: ru 
  });
}
```

### 6.5 Локальное хранилище (MMKV)

```typescript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// Токены
storage.set('accessToken', token);
storage.set('refreshToken', token);

// Пользователь
storage.set('user', JSON.stringify(user));

// Флаги
storage.set('onboardingCompleted', true);
storage.set('notificationsEnabled', true);

// Кэш (с TTL)
interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

function setCache<T>(key: string, data: T, ttlMs: number) {
  const item: CacheItem<T> = {
    data,
    expiresAt: Date.now() + ttlMs,
  };
  storage.set(`cache:${key}`, JSON.stringify(item));
}

function getCache<T>(key: string): T | null {
  const raw = storage.getString(`cache:${key}`);
  if (!raw) return null;
  
  const item: CacheItem<T> = JSON.parse(raw);
  if (Date.now() > item.expiresAt) {
    storage.delete(`cache:${key}`);
    return null;
  }
  
  return item.data;
}
```

### 6.6 Environment Config

```typescript
// .env
API_BASE_URL=https://api.handshakeme.com/v1
WS_URL=wss://ws.handshakeme.com
BUILD_ENV=production

// config.ts
export const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.handshakeme.com/v1',
  wsUrl: process.env.WS_URL || 'wss://ws.handshakeme.com',
  buildEnv: process.env.BUILD_ENV || 'development',
  
  // Timeouts
  apiTimeout: 30000,
  wsReconnectDelay: 1000,
  
  // Cache TTL
  cacheTTL: {
    categories: 24 * 60 * 60 * 1000, // 24 часа
    orders: 60 * 1000, // 1 минута
    profile: 5 * 60 * 1000, // 5 минут
  },
  
  // Limits
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  maxImages: 10,
};
```

---

## 7. Backend Gaps (Что нужно добавить/пофиксить)

### 7.1 Критичные

| # | Проблема | Описание | Приоритет |
|---|----------|----------|-----------|
| 1 | **Push token registration** | Нет эндпоинта для регистрации push токенов | 🔴 High |

### 7.2 Важные

| # | Проблема | Описание | Приоритет |
|---|----------|----------|-----------|
| 2 | **Сортировка заказов** | Нет параметра `ordering` в list-orders | 🟡 Medium |
| 3 | **Фильтр по навыкам** | Нет фильтра `skills` в search-orders | 🟡 Medium |
| 4 | **Геолокация** | Нет фильтра по радиусу от координат | 🟡 Medium |
| 5 | **Избранные заказы** | Нет эндпоинта `GET /orders/favorites` | 🟡 Medium |
| 6 | **Статистика мастера** | `GET /masters/:id/stats` не реализован | 🟡 Medium |
| 7 | **WebSocket auth** | Нужен authorizer для WebSocket | 🟡 Medium |

### 7.3 Улучшения

| # | Проблема | Описание | Приоритет |
|---|----------|----------|-----------|
| 8 | **Cursor pagination** | Для чатов лучше cursor вместо page | 🟢 Low |
| 9 | **Rate limiting** | Нет видимых rate limits в ответах | 🟢 Low |
| 10 | **ETag/If-None-Match** | Для оптимизации кэширования | 🟢 Low |
| 11 | **Batch operations** | Массовое удаление уведомлений | 🟢 Low |
| 12 | **Search suggestions** | Автодополнение для поиска | 🟢 Low |

---

## 8. Open Questions

1. **Верификация**: Какие документы обязательны? Сроки проверки?

2. **Push уведомления**: Какой формат payload для deep links?

3. **WebSocket**: Нужен ли heartbeat от клиента? Какой интервал?

4. **Локализация**: Как переключать язык? Хранится ли на сервере?

5. **Файлы**: Какие лимиты на загрузку? Нужна ли компрессия на клиенте?

---

## Приложения

### A. Типы для TypeScript

См. файл `types.ts` (генерируется отдельно)

### B. OpenAPI Spec

См. файл `openapi.generated.json` (генерируется отдельно)

---

*Документ создан на основе анализа исходного кода backend (lambda). Версия: 1.0.0*
с