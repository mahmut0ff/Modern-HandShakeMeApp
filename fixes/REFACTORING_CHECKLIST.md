# Lambda Refactoring Checklist

## Phase 1: Критическая Безопасность ⚠️

### [ ] 1.1 JWT Secret Hardcoding (2 дня)
- [ ] Найти все файлы с `JWT_SECRET || 'your-secret-key'` (40+ файлов)
- [ ] Заменить на проверку с throw error
- [ ] Обновить Terraform для всех Lambda
- [ ] Добавить проверку в CI/CD
- [ ] Протестировать на dev окружении
- [ ] Deploy на production

**Файлы:**
- [ ] lambda/core/reviews/* (10 файлов)
- [ ] lambda/core/profiles/* (12 файлов)
- [ ] lambda/core/projects/* (11 файлов)
- [ ] lambda/core/orders/* (5 файлов)
- [ ] lambda/core/recommendations/*
- [ ] lambda/core/shared/utils/jwt.ts

---

### [ ] 1.2 Централизация Authentication (5 дней)
- [ ] Мигрировать reviews module на withAuth (10 файлов)
- [ ] Мигрировать profiles module на withAuth (12 файлов)
- [ ] Мигрировать projects module на withAuth (11 файлов)
- [ ] Мигрировать orders module на withAuth (5 файлов)
- [ ] Удалить прямые вызовы jwt.verify()
- [ ] Добавить token blacklist support
- [ ] Обновить тесты
- [ ] Code review
- [ ] Deploy

**Критерии успеха:**
- Все endpoints используют withAuth
- Нет прямых вызовов jwt.verify()
- Token blacklist работает
- Все тесты проходят

---

### [ ] 1.3 Input Sanitization (3 дня)
- [ ] Создать sanitization middleware
- [ ] Обновить sanitize.ts с DOMPurify
- [ ] Добавить в orders module
- [ ] Добавить в profiles module
- [ ] Добавить в reviews module
- [ ] Добавить в applications module
- [ ] Добавить в disputes module
- [ ] Написать тесты
- [ ] Deploy

---

## Phase 2: Консистентность 🔄

### [ ] 2.1 Унификация Response Format (5 дней)
- [ ] Выбрать unified-response.ts как стандарт
- [ ] Создать migration guide
- [ ] Мигрировать analytics module (3 файла)
- [ ] Мигрировать applications module (10 файлов)
- [ ] Мигрировать auth module (10 файлов)
- [ ] Мигрировать availability module (4 файла)
- [ ] Мигрировать calendar module (2 файла)
- [ ] Мигрировать categories module (4 файла)
- [ ] Мигрировать chat module (15 файлов)
- [ ] Мигрировать disputes module (11 файлов)
- [ ] Мигрировать notifications module (15 файлов)
- [ ] Мигрировать orders module (16 файлов)
- [ ] Мигрировать profiles module (18 файлов)
- [ ] Мигрировать projects module (10 файлов)
- [ ] Мигрировать reviews module (11 файлов)
- [ ] Мигрировать services module (14 файлов)
- [ ] Мигрировать wallet module (8 файлов)
- [ ] Обновить mobile app
- [ ] Тестирование
- [ ] Deploy

**Прогресс:** 0/150+ файлов

---

### [ ] 2.2 Стандартизация Error Handling (3 дня)
- [ ] Убедиться что withErrorHandler везде
- [ ] Удалить manual try-catch блоки
- [ ] Стандартизировать error codes
- [ ] Обновить документацию
- [ ] Написать тесты
- [ ] Deploy

**Файлы без withErrorHandler:**
- [ ] lambda/core/orders/create-order-dynamodb.ts
- [ ] lambda/core/profiles/get-current-user-dynamodb.ts
- [ ] lambda/core/projects/get-project-dynamodb.ts
- [ ] И другие ~60 файлов

---

### [ ] 2.3 Унификация Validation (3 дня)
- [ ] Использовать validate() helper везде
- [ ] Создать shared validation schemas
- [ ] Добавить custom error messages
- [ ] Обновить тесты
- [ ] Deploy

**Модули для обновления:**
- [ ] analytics
- [ ] applications
- [ ] auth
- [ ] availability
- [ ] calendar
- [ ] categories
- [ ] chat
- [ ] disputes
- [ ] orders
- [ ] profiles
- [ ] projects
- [ ] reviews
- [ ] services
- [ ] wallet

---

### [ ] 2.4 Стандартизация Logging (2 дня)
- [ ] Найти все console.* (60+ файлов)
- [ ] Заменить на logger.*
- [ ] Добавить correlation IDs
- [ ] Добавить structured logging
- [ ] Настроить CloudWatch Insights
- [ ] Deploy

**Файлы с console.*:**
- [ ] lambda/core/shared/services/* (10+ файлов)
- [ ] lambda/core/shared/repositories/* (5+ файлов)
- [ ] lambda/core/orders/* (3+ файла)
- [ ] lambda/core/profiles/* (3+ файла)
- [ ] lambda/core/projects/* (3+ файла)
- [ ] И другие ~40 файлов

---

## Phase 3: Производительность ⚡

### [ ] 3.1 Оптимизация DynamoDB Queries (5 дней)
- [ ] Найти все in-memory filtering
- [ ] Заменить на DynamoDB queries
- [ ] Добавить GSI где нужно
- [ ] Использовать batch operations
- [ ] Добавить connection pooling
- [ ] Тестирование производительности
- [ ] Deploy

**Файлы для оптимизации:**
- [ ] lambda/core/notifications/delete-notification.ts
- [ ] lambda/core/reviews/create-review-dynamodb.ts
- [ ] lambda/core/disputes/get-disputes-dynamodb.ts
- [ ] И другие ~30 файлов

---

### [ ] 3.2 Добавить Caching (5 дней)
- [ ] Настроить Redis/ElastiCache
- [ ] Добавить caching для user profiles
- [ ] Добавить caching для master profiles
- [ ] Добавить caching для categories
- [ ] Добавить caching для order lists
- [ ] Добавить caching для review stats
- [ ] Реализовать cache invalidation
- [ ] Добавить cache metrics
- [ ] Тестирование
- [ ] Deploy

---

### [ ] 3.3 Добавить Pagination (3 дня)
- [ ] Создать pagination helper
- [ ] Добавить в orders/list-orders-dynamodb.ts
- [ ] Добавить в notifications/list-notifications-dynamodb.ts
- [ ] Добавить в reviews/get-my-reviews-dynamodb.ts
- [ ] Добавить в applications/list-applications-dynamodb.ts
- [ ] Добавить в projects/get-my-projects-dynamodb.ts
- [ ] Обновить mobile app
- [ ] Тестирование
- [ ] Deploy

---

### [ ] 3.4 Решить N+1 Problems (3 дня)
- [ ] Найти все N+1 queries
- [ ] Использовать batch gets в disputes module
- [ ] Денормализовать данные где нужно
- [ ] Добавить monitoring
- [ ] Тестирование
- [ ] Deploy

---

## Phase 4: Архитектура 🏗️

### [ ] 4.1 Transaction Support (5 дней)
- [ ] Идентифицировать критические операции
- [ ] Добавить TransactWrite в applications/create-application.ts
- [ ] Добавить TransactWrite в projects/complete-project-dynamodb.ts
- [ ] Добавить TransactWrite в wallet operations
- [ ] Добавить retry logic
- [ ] Тестирование
- [ ] Deploy

---

### [ ] 4.2 Рефакторинг Больших Handlers (7 дней)
- [ ] Рефакторинг time-tracking/manage-time-sessions.ts (756 строк)
- [ ] Рефакторинг tracking/real-time-location.ts (560 строк)
- [ ] Рефакторинг applications/create-application.ts (100+ строк)
- [ ] Извлечь бизнес-логику в services
- [ ] Улучшить тестируемость
- [ ] Обновить документацию
- [ ] Deploy

---

### [ ] 4.3 Реализовать TODO Items (10 дней)
- [ ] Payment provider integration (wallet module)
- [ ] WebSocket implementation (shared/services)
- [ ] Notification system completion
- [ ] Order service integration (disputes module)
- [ ] Тестирование
- [ ] Deploy

---

## Дополнительные Задачи

### [ ] Testing
- [ ] Unit tests для всех services
- [ ] Integration tests для repositories
- [ ] E2E tests для критических flows
- [ ] Contract tests для API

### [ ] Monitoring
- [ ] CloudWatch Logs structured logging
- [ ] CloudWatch Metrics для business metrics
- [ ] X-Ray distributed tracing
- [ ] Alarms для критических ошибок

### [ ] Documentation
- [ ] OpenAPI/Swagger spec
- [ ] README для каждого модуля
- [ ] Architecture Decision Records
- [ ] Runbooks

### [ ] CI/CD
- [ ] Automated tests на PR
- [ ] Security scanning (SAST/DAST)
- [ ] Dependency vulnerability scanning
- [ ] Automated deployment с rollback

---

## Метрики Прогресса

### Безопасность
- [ ] JWT Secret: 0/40 файлов исправлено
- [ ] Authentication: 0/80 файлов мигрировано
- [ ] Sanitization: 0/50 файлов обновлено

### Консистентность
- [ ] Response Format: 0/150 файлов мигрировано
- [ ] Error Handling: 0/60 файлов обновлено
- [ ] Validation: 0/100 файлов обновлено
- [ ] Logging: 0/60 файлов исправлено

### Производительность
- [ ] DynamoDB Queries: 0/30 файлов оптимизировано
- [ ] Caching: 0/20 endpoints добавлено
- [ ] Pagination: 0/15 endpoints добавлено
- [ ] N+1 Problems: 0/10 файлов исправлено

### Архитектура
- [ ] Transactions: 0/10 операций обновлено
- [ ] Refactoring: 0/5 больших handlers
- [ ] TODO Items: 0/25 реализовано

---

## Приоритеты

### Неделя 1-2: Критическая Безопасность
1. JWT Secret Hardcoding
2. Централизация Authentication
3. Input Sanitization

### Неделя 3-5: Консистентность
1. Унификация Response Format
2. Стандартизация Error Handling
3. Унификация Validation
4. Стандартизация Logging

### Неделя 6-8: Производительность
1. Оптимизация DynamoDB Queries
2. Добавить Caching
3. Добавить Pagination
4. Решить N+1 Problems

### Неделя 9-12: Архитектура
1. Transaction Support
2. Рефакторинг Больших Handlers
3. Реализовать TODO Items

---

## Команда и Ответственность

- **Security Lead:** Отвечает за Phase 1
- **Backend Lead:** Отвечает за Phase 2-3
- **Architecture Lead:** Отвечает за Phase 4
- **QA Lead:** Тестирование всех фаз
- **DevOps Lead:** CI/CD и мониторинг

---

## Критерии Завершения

### Phase 1 Complete
- ✅ Нет hardcoded secrets
- ✅ Все endpoints используют withAuth
- ✅ Input sanitization везде
- ✅ Security scan проходит

### Phase 2 Complete
- ✅ Единый response format
- ✅ Единый error handling
- ✅ Единый validation approach
- ✅ Structured logging везде

### Phase 3 Complete
- ✅ Нет in-memory filtering
- ✅ Caching работает
- ✅ Pagination везде
- ✅ Нет N+1 queries

### Phase 4 Complete
- ✅ Критические операции атомарны
- ✅ Нет handlers >200 строк
- ✅ Все TODO реализованы
- ✅ 80%+ test coverage
