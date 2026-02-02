# Issues Index - Полный Список Проблем

Индекс всех найденных проблем с приоритетами и статусами.

---

## 🔴 КРИТИЧЕСКИЕ (Priority 1)

### SEC-001: JWT Secret Hardcoding
**Категория:** Security  
**Серьезность:** Critical  
**Затронуто:** 40+ файлов  
**Усилия:** 2 дня  
**Статус:** 🔴 Open

**Описание:** Использование небезопасного fallback для JWT_SECRET

**Файлы:**
- lambda/core/reviews/* (10 файлов)
- lambda/core/profiles/* (12 файлов)
- lambda/core/projects/* (11 файлов)
- lambda/core/orders/* (5 файлов)
- lambda/core/recommendations/*
- lambda/core/shared/utils/jwt.ts

**Решение:** См. SECURITY_FIXES.md

---

### SEC-002: Multiple Authentication Methods
**Категория:** Security  
**Серьезность:** High  
**Затронуто:** 80+ файлов  
**Усилия:** 5 дней  
**Статус:** 🔴 Open

**Описание:** 4 разных способа верификации JWT токенов

**Подходы:**
1. Прямой jwt.verify() - 40+ файлов
2. verifyToken() helper - 10+ файлов
3. withAuth middleware - 60+ файлов
4. auth.ts utils - 5+ файлов

**Решение:** Мигрировать все на withAuth middleware

---

### SEC-003: No Input Sanitization
**Категория:** Security  
**Серьезность:** High  
**Затронуто:** Все POST/PUT endpoints  
**Усилия:** 3 дня  
**Статус:** 🔴 Open

**Описание:** Пользовательский ввод не санитизируется (XSS риск)

**Модули:**
- orders (create, update)
- profiles (update)
- reviews (create, update)
- applications (create)
- disputes (create, add evidence)
- chat (send message)

**Решение:** Создать sanitization middleware

---

### SEC-004: Weak Rate Limiting
**Категория:** Security  
**Серьезность:** Medium  
**Затронуто:** 10+ endpoints  
**Усилия:** 2 дня  
**Статус:** 🔴 Open

**Описание:** In-memory rate limiting вместо Redis

**Файлы:**
- lambda/core/reviews/create-review-dynamodb.ts
- lambda/core/auth/* (несколько файлов)

**Решение:** Использовать Redis для rate limiting

---

### SEC-005: CORS Misconfiguration
**Категория:** Security  
**Серьезность:** Medium  
**Затронуто:** security.ts  
**Усилия:** 1 час  
**Статус:** 🔴 Open

**Описание:** origins: ['*'] слишком открыто

**Решение:** Использовать whitelist из env variables

---

## 🟡 ВЫСОКИЙ ПРИОРИТЕТ (Priority 2)

### CONS-001: Multiple Response Formats
**Категория:** Consistency  
**Серьезность:** High  
**Затронуто:** 150+ endpoints  
**Усилия:** 5 дней  
**Статус:** 🟡 Open

**Описание:** 3 разных формата ответов

**Форматы:**
1. response.ts - 40% файлов
2. unified-response.ts - 30% файлов
3. Manual JSON - 30% файлов

**Решение:** Мигрировать все на unified-response.ts

---

### CONS-002: Inconsistent Error Handling
**Категория:** Consistency  
**Серьезность:** High  
**Затронуто:** 60+ endpoints  
**Усилия:** 3 дня  
**Статус:** 🟡 Open

**Описание:** Разные подходы к обработке ошибок

**Паттерны:**
1. withErrorHandler - 60% файлов
2. Manual try-catch - 30% файлов
3. No error handling - 10% файлов

**Решение:** Использовать withErrorHandler везде

---

### CONS-003: Inconsistent Validation
**Категория:** Consistency  
**Серьезность:** Medium  
**Затронуто:** 100+ endpoints  
**Усилия:** 3 дня  
**Статус:** 🟡 Open

**Описание:** 4 разных способа валидации

**Способы:**
1. schema.parse() - 40%
2. validate() helper - 30%
3. schema.safeParse() - 20%
4. No validation - 10%

**Решение:** Использовать validate() helper везде

---

### CONS-004: Inconsistent Logging
**Категория:** Consistency  
**Серьезность:** Medium  
**Затронуто:** 60+ файлов  
**Усилия:** 2 дня  
**Статус:** 🟡 Open

**Описание:** Смешанное использование logger и console

**Статистика:**
- logger.*: 60% файлов
- console.*: 40% файлов

**Файлы с console.*:**
- lambda/core/shared/services/* (10+ файлов)
- lambda/core/shared/repositories/* (5+ файлов)
- lambda/core/orders/* (3+ файла)
- lambda/core/profiles/* (3+ файла)
- lambda/core/projects/* (3+ файла)

**Решение:** Заменить все console.* на logger.*

---

## 🟢 СРЕДНИЙ ПРИОРИТЕТ (Priority 3)

### PERF-001: Inefficient DynamoDB Queries
**Категория:** Performance  
**Серьезность:** Medium  
**Затронуто:** 30+ файлов  
**Усилия:** 5 дней  
**Статус:** 🟢 Open

**Описание:** In-memory filtering вместо DynamoDB queries

**Примеры:**
- notifications/delete-notification.ts (fetch 1000, filter 1)
- reviews/create-review-dynamodb.ts (fetch 50, filter by time)
- disputes/get-disputes-dynamodb.ts (N+1 queries)

**Решение:** Использовать DynamoDB queries с GSI

---

### PERF-002: No Caching
**Категория:** Performance  
**Серьезность:** Medium  
**Затронуто:** Все read endpoints  
**Усилия:** 5 дней  
**Статус:** 🟢 Open

**Описание:** Cache service существует, но не используется

**Endpoints для кеширования:**
- User profiles
- Master profiles
- Categories
- Order lists
- Review stats

**Решение:** Добавить Redis caching

---

### PERF-003: No Pagination
**Категория:** Performance  
**Серьезность:** Medium  
**Затронуто:** 15+ list endpoints  
**Усилия:** 3 дня  
**Статус:** 🟢 Open

**Описание:** Некоторые endpoints возвращают все записи

**Файлы:**
- notifications/list-notifications-dynamodb.ts (limit 1000)
- orders/list-orders-dynamodb.ts (no limit)
- reviews/get-my-reviews-dynamodb.ts (no limit)
- applications/list-applications-dynamodb.ts (no limit)

**Решение:** Добавить pagination helper

---

### PERF-004: N+1 Query Problem
**Категория:** Performance  
**Серьезность:** Medium  
**Затронуто:** 10+ файлов  
**Усилия:** 3 дней  
**Статус:** 🟢 Open

**Описание:** Multiple sequential queries вместо batch

**Примеры:**
- disputes/get-disputes-dynamodb.ts (fetch users for each dispute)
- orders/list-orders-dynamodb.ts (fetch client for each order)

**Решение:** Использовать batch gets или денормализацию

---

### PERF-005: No Connection Pooling
**Категория:** Performance  
**Серьезность:** Low  
**Затронуто:** Все Lambda  
**Усилия:** 1 час  
**Статус:** 🟢 Open

**Описание:** DynamoDB client создается в каждом handler

**Решение:** Создать client вне handler (уже сделано в dynamodb-client.ts)

---

### PERF-006: Large Handler Functions
**Категория:** Performance  
**Серьезность:** Low  
**Затронуто:** 5 файлов  
**Усилия:** 7 дней  
**Статус:** 🟢 Open

**Описание:** Handlers >500 строк сложно поддерживать

**Файлы:**
- time-tracking/manage-time-sessions.ts (756 строк)
- tracking/real-time-location.ts (560 строк)

**Решение:** Разбить на handler/service/repository

---

## 🔵 НИЗКИЙ ПРИОРИТЕТ (Priority 4)

### ARCH-001: No Transaction Support
**Категория:** Architecture  
**Серьезность:** Medium  
**Затронуто:** 10+ операций  
**Усилия:** 5 дней  
**Статус:** 🔵 Open

**Описание:** Нет атомарных операций для связанных обновлений

**Операции:**
- applications/create-application.ts (create + increment count)
- projects/complete-project-dynamodb.ts (update + create transaction)
- wallet/* (multiple balance updates)

**Решение:** Использовать DynamoDB TransactWrite

---

### ARCH-002: Missing Features (TODO)
**Категория:** Architecture  
**Серьезность:** Low  
**Затронуто:** 25+ TODO comments  
**Усилия:** 10 дней  
**Статус:** 🔵 Open

**Описание:** Неполная реализация функционала

**TODO Items:**
- wallet/deposit-dynamodb.ts - Payment provider integration
- wallet/withdraw-dynamodb.ts - Payment provider integration
- disputes/create-dispute.ts - Order service integration
- disputes/* - Notification system (8 файлов)
- shared/services/websocket.service.ts - WebSocket implementation

**Решение:** Реализовать по приоритету

---

### ARCH-003: No API Versioning
**Категория:** Architecture  
**Серьезность:** Low  
**Затронуто:** Все endpoints  
**Усилия:** 3 дня  
**Статус:** 🔵 Open

**Описание:** Нет версионирования API

**Решение:** Добавить /v1/ prefix и version headers

---

### ARCH-004: No Request Validation Middleware
**Категория:** Architecture  
**Серьезность:** Low  
**Затронуто:** Все endpoints  
**Усилия:** 2 дня  
**Статус:** 🔵 Open

**Описание:** Каждый endpoint валидирует независимо

**Решение:** Создать validation middleware

---

### ARCH-005: No Centralized Error Codes
**Категория:** Architecture  
**Серьезность:** Low  
**Затронуто:** Все endpoints  
**Усилия:** 1 день  
**Статус:** 🔵 Open

**Описание:** Нет единого enum для error codes

**Решение:** Создать ErrorCode enum (см. QUICK_WINS.md)

---

## 📊 Статистика по Категориям

### По Серьезности
- **Critical:** 1 issue
- **High:** 6 issues
- **Medium:** 10 issues
- **Low:** 8 issues

### По Категориям
- **Security:** 5 issues
- **Consistency:** 4 issues
- **Performance:** 6 issues
- **Architecture:** 5 issues

### По Усилиям
- **< 1 день:** 3 issues
- **1-3 дня:** 8 issues
- **3-5 дней:** 6 issues
- **5-10 дней:** 3 issues
- **> 10 дней:** 1 issue

### По Статусу
- **🔴 Open (Critical):** 5 issues
- **🟡 Open (High):** 4 issues
- **🟢 Open (Medium):** 6 issues
- **🔵 Open (Low):** 5 issues
- **✅ Resolved:** 0 issues

---

## 🎯 Рекомендуемый Порядок Исправления

### Week 1
1. SEC-001: JWT Secret Hardcoding
2. SEC-005: CORS Misconfiguration
3. PERF-005: Connection Pooling
4. ARCH-005: Error Codes

### Week 2
1. SEC-002: Multiple Authentication Methods
2. SEC-003: Input Sanitization

### Week 3-4
1. CONS-001: Response Formats
2. CONS-002: Error Handling
3. CONS-003: Validation
4. CONS-004: Logging

### Week 5-6
1. PERF-001: DynamoDB Queries
2. PERF-002: Caching
3. PERF-003: Pagination
4. PERF-004: N+1 Problems

### Week 7-8
1. SEC-004: Rate Limiting
2. ARCH-001: Transactions
3. PERF-006: Large Handlers

### Week 9-12
1. ARCH-002: TODO Items
2. ARCH-003: API Versioning
3. ARCH-004: Validation Middleware

---

## 📝 Tracking Template

```markdown
## Issue: [ID] - [Title]

**Status:** 🔴/🟡/🟢/🔵/✅  
**Assigned:** @username  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

### Progress
- [ ] Analysis
- [ ] Implementation
- [ ] Testing
- [ ] Code Review
- [ ] Deployment

### Notes
- Note 1
- Note 2

### Related PRs
- #123
- #124
```

---

## 🔄 Обновления

### 2026-02-02
- ✅ Создан индекс всех issues
- ✅ Определены приоритеты
- ✅ Оценены усилия

### Следующие Обновления
- Weekly status updates
- Новые найденные issues
- Resolved issues

---

**Последнее обновление:** 2 февраля 2026  
**Всего issues:** 20  
**Resolved:** 0  
**In Progress:** 0  
**Open:** 20
