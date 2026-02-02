# Files to Modify - Полный Список

Список всех файлов, требующих изменений, сгруппированных по задачам.

---

## 🔴 SEC-001: JWT Secret Hardcoding (40+ файлов)

### Reviews Module (10 файлов)
- [ ] lambda/core/reviews/create-review-dynamodb.ts
- [ ] lambda/core/reviews/delete-review.ts
- [ ] lambda/core/reviews/get-my-reviews-dynamodb.ts
- [ ] lambda/core/reviews/get-needs-response.ts
- [ ] lambda/core/reviews/get-review.ts
- [ ] lambda/core/reviews/mark-helpful.ts
- [ ] lambda/core/reviews/report-review.ts
- [ ] lambda/core/reviews/respond-to-review-dynamodb.ts
- [ ] lambda/core/reviews/update-review-dynamodb.ts
- [ ] lambda/core/reviews/get-review-stats-dynamodb.ts

### Profiles Module (12 файлов)
- [ ] lambda/core/profiles/delete-avatar-dynamodb.ts
- [ ] lambda/core/profiles/get-current-user-dynamodb.ts
- [ ] lambda/core/profiles/get-master-stats-dynamodb.ts
- [ ] lambda/core/profiles/get-my-client-profile-dynamodb.ts
- [ ] lambda/core/profiles/get-my-master-profile-dynamodb.ts
- [ ] lambda/core/profiles/get-profile-visibility.ts
- [ ] lambda/core/profiles/update-client-profile-dynamodb.ts
- [ ] lambda/core/profiles/update-current-user-dynamodb.ts
- [ ] lambda/core/profiles/update-master-profile-dynamodb.ts
- [ ] lambda/core/profiles/update-profile-visibility.ts
- [ ] lambda/core/profiles/update-user-profile.ts
- [ ] lambda/core/profiles/upload-avatar-dynamodb.ts

### Projects Module (11 файлов)
- [ ] lambda/core/projects/cancel-project-dynamodb.ts
- [ ] lambda/core/projects/complete-project-dynamodb.ts
- [ ] lambda/core/projects/create-milestone.ts
- [ ] lambda/core/projects/delete-milestone.ts
- [ ] lambda/core/projects/get-my-projects-dynamodb.ts
- [ ] lambda/core/projects/get-project-dynamodb.ts
- [ ] lambda/core/projects/get-project-files.ts
- [ ] lambda/core/projects/list-milestones.ts
- [ ] lambda/core/projects/list-project-payments.ts
- [ ] lambda/core/projects/update-milestone.ts
- [ ] lambda/core/projects/update-project-status-dynamodb.ts

### Orders Module (5 файлов)
- [ ] lambda/core/orders/add-to-favorites-dynamodb.ts
- [ ] lambda/core/orders/delete-order-dynamodb.ts
- [ ] lambda/core/orders/get-my-orders-dynamodb.ts
- [ ] lambda/core/orders/remove-from-favorites-dynamodb.ts
- [ ] lambda/core/orders/upload-order-file-dynamodb.ts

### Other Modules
- [ ] lambda/core/recommendations/recommended-orders.ts
- [ ] lambda/core/shared/utils/jwt.ts

---

## 🔴 SEC-002: Migrate to withAuth (80+ файлов)

### Все файлы из SEC-001 (40+ файлов)
Плюс дополнительно:

### Orders Module
- [ ] lambda/core/orders/create-order-dynamodb.ts
- [ ] lambda/core/orders/update-order-dynamodb.ts
- [ ] lambda/core/orders/get-order-dynamodb.ts
- [ ] lambda/core/orders/list-orders-dynamodb.ts
- [ ] lambda/core/orders/search-orders-dynamodb.ts

### Applications Module
- [ ] lambda/core/applications/get-application.ts
- [ ] lambda/core/applications/get-order-applications.ts
- [ ] lambda/core/applications/get-my-applications-dynamodb.ts
- [ ] lambda/core/applications/list-applications-dynamodb.ts
- [ ] lambda/core/applications/respond-to-application-dynamodb.ts
- [ ] lambda/core/applications/update-application-dynamodb.ts
- [ ] lambda/core/applications/delete-application-dynamodb.ts

### Services Module
- [ ] lambda/core/services/create-service-dynamodb.ts
- [ ] lambda/core/services/update-service-dynamodb.ts
- [ ] lambda/core/services/delete-service-dynamodb.ts
- [ ] lambda/core/services/get-service-dynamodb.ts
- [ ] lambda/core/services/list-services-dynamodb.ts
- [ ] lambda/core/services/search-services-dynamodb.ts

### Portfolio Module
- [ ] lambda/core/portfolio/create-item.ts
- [ ] lambda/core/portfolio/update-portfolio-item.ts
- [ ] lambda/core/portfolio/delete-portfolio-item.ts
- [ ] lambda/core/portfolio/list-portfolio.ts

---

## 🔴 SEC-003: Input Sanitization (50+ файлов)

### Orders Module
- [ ] lambda/core/orders/create-order-dynamodb.ts
- [ ] lambda/core/orders/update-order-dynamodb.ts

### Profiles Module
- [ ] lambda/core/profiles/update-current-user-dynamodb.ts
- [ ] lambda/core/profiles/update-master-profile-dynamodb.ts
- [ ] lambda/core/profiles/update-client-profile-dynamodb.ts
- [ ] lambda/core/profiles/update-user-profile.ts

### Reviews Module
- [ ] lambda/core/reviews/create-review-dynamodb.ts
- [ ] lambda/core/reviews/update-review-dynamodb.ts
- [ ] lambda/core/reviews/respond-to-review-dynamodb.ts

### Applications Module
- [ ] lambda/core/applications/create-application.ts
- [ ] lambda/core/applications/update-application-dynamodb.ts
- [ ] lambda/core/applications/respond-to-application-dynamodb.ts

### Disputes Module
- [ ] lambda/core/disputes/create-dispute.ts
- [ ] lambda/core/disputes/add-evidence.ts
- [ ] lambda/core/disputes/send-dispute-message-dynamodb.ts
- [ ] lambda/core/disputes/update-dispute-status.ts

### Chat Module
- [ ] lambda/core/chat/send-message-dynamodb.ts
- [ ] lambda/core/chat/send-image-dynamodb.ts
- [ ] lambda/core/chat/create-room-dynamodb.ts

### Services Module
- [ ] lambda/core/services/create-service-dynamodb.ts
- [ ] lambda/core/services/update-service-dynamodb.ts

### Portfolio Module
- [ ] lambda/core/portfolio/create-item.ts
- [ ] lambda/core/portfolio/update-portfolio-item.ts

### Projects Module
- [ ] lambda/core/projects/create-milestone.ts
- [ ] lambda/core/projects/update-milestone.ts

---

## 🟡 CONS-001: Response Format (150+ файлов)

### Все модули требуют миграции на unified-response.ts

**Приоритет по модулям:**
1. Analytics (3 файла)
2. Applications (10 файлов)
3. Auth (10 файлов)
4. Availability (4 файла)
5. Calendar (2 файла)
6. Categories (4 файла)
7. Chat (15 файлов)
8. Disputes (11 файлов)
9. Notifications (15 файлов)
10. Orders (16 файлов)
11. Profiles (18 файлов)
12. Projects (10 файлов)
13. Reviews (11 файлов)
14. Services (14 файлов)
15. Wallet (8 файлов)
16. И остальные...

---

## 🟡 CONS-004: Logging (60+ файлов)

### Shared Services (10+ файлов)
- [ ] lambda/core/shared/services/masters-location.service.ts
- [ ] lambda/core/shared/services/localization.service.ts
- [ ] lambda/core/shared/services/kyrgyzstan-sms.service.ts
- [ ] lambda/core/shared/services/instant-booking.service.ts
- [ ] lambda/core/shared/services/cache.service.ts
- [ ] lambda/core/shared/services/s3.ts
- [ ] lambda/core/shared/services/sms.ts

### Shared Repositories (5+ файлов)
- [ ] lambda/core/shared/repositories/notification.repository.ts
- [ ] lambda/core/shared/repositories/location.repository.ts

### Shared Utils (3+ файла)
- [ ] lambda/core/shared/utils/localization.ts
- [ ] lambda/core/shared/utils/cache-invalidation.ts

### Orders Module (3+ файла)
- [ ] lambda/core/orders/create-order-dynamodb.ts
- [ ] lambda/core/orders/delete-order-dynamodb.ts
- [ ] lambda/core/orders/get-order-dynamodb.ts

### Profiles Module (3+ файла)
- [ ] lambda/core/profiles/get-current-user-dynamodb.ts
- [ ] lambda/core/profiles/get-user-dynamodb.ts
- [ ] lambda/core/profiles/update-user-dynamodb.ts

### Projects Module (3+ файла)
- [ ] lambda/core/projects/get-project-dynamodb.ts
- [ ] lambda/core/projects/complete-project-dynamodb.ts
- [ ] lambda/core/projects/cancel-project-dynamodb.ts

---

## 🟢 PERF-001: DynamoDB Queries (30+ файлов)

### High Priority
- [ ] lambda/core/notifications/delete-notification.ts
- [ ] lambda/core/reviews/create-review-dynamodb.ts
- [ ] lambda/core/disputes/get-disputes-dynamodb.ts
- [ ] lambda/core/orders/list-orders-dynamodb.ts
- [ ] lambda/core/applications/list-applications-dynamodb.ts

### Medium Priority
- [ ] lambda/core/notifications/list-notifications-dynamodb.ts
- [ ] lambda/core/reviews/get-my-reviews-dynamodb.ts
- [ ] lambda/core/projects/get-my-projects-dynamodb.ts
- [ ] lambda/core/services/list-services-dynamodb.ts
- [ ] lambda/core/portfolio/list-portfolio.ts

### Low Priority
- [ ] lambda/core/chat/list-rooms-dynamodb.ts
- [ ] lambda/core/chat/get-messages-dynamodb.ts
- [ ] lambda/core/wallet/get-transactions-dynamodb.ts

---

## 🟢 PERF-002: Add Caching (20+ endpoints)

### User Data
- [ ] lambda/core/profiles/get-current-user-dynamodb.ts
- [ ] lambda/core/profiles/get-user-dynamodb.ts
- [ ] lambda/core/profiles/get-my-master-profile-dynamodb.ts
- [ ] lambda/core/profiles/get-my-client-profile-dynamodb.ts
- [ ] lambda/core/profiles/get-master-stats-dynamodb.ts

### Master Data
- [ ] lambda/core/profiles/search-masters-dynamodb.ts
- [ ] lambda/core/profiles/get-master-profile-dynamodb.ts

### Categories
- [ ] lambda/core/categories/list-categories-dynamodb.ts
- [ ] lambda/core/categories/get-category-skills.ts
- [ ] lambda/core/categories/list-skills.ts

### Orders
- [ ] lambda/core/orders/list-orders-dynamodb.ts
- [ ] lambda/core/orders/search-orders-dynamodb.ts

### Reviews
- [ ] lambda/core/reviews/get-review-stats-dynamodb.ts

### Services
- [ ] lambda/core/services/list-services-dynamodb.ts
- [ ] lambda/core/services/search-services-dynamodb.ts

---

## 🟢 PERF-003: Add Pagination (15+ endpoints)

### High Priority
- [ ] lambda/core/notifications/list-notifications-dynamodb.ts
- [ ] lambda/core/orders/list-orders-dynamodb.ts
- [ ] lambda/core/reviews/get-my-reviews-dynamodb.ts
- [ ] lambda/core/applications/list-applications-dynamodb.ts
- [ ] lambda/core/projects/get-my-projects-dynamodb.ts

### Medium Priority
- [ ] lambda/core/chat/list-rooms-dynamodb.ts
- [ ] lambda/core/chat/get-messages-dynamodb.ts
- [ ] lambda/core/services/list-services-dynamodb.ts
- [ ] lambda/core/portfolio/list-portfolio.ts
- [ ] lambda/core/wallet/get-transactions-dynamodb.ts

### Low Priority
- [ ] lambda/core/disputes/get-disputes-dynamodb.ts
- [ ] lambda/core/orders/search-orders-dynamodb.ts
- [ ] lambda/core/services/search-services-dynamodb.ts
- [ ] lambda/core/profiles/search-masters-dynamodb.ts

---

## 🔵 ARCH-001: Add Transactions (10+ операций)

### High Priority
- [ ] lambda/core/applications/create-application.ts
- [ ] lambda/core/projects/complete-project-dynamodb.ts
- [ ] lambda/core/wallet/deposit-dynamodb.ts
- [ ] lambda/core/wallet/withdraw-dynamodb.ts
- [ ] lambda/core/wallet/send-payment-dynamodb.ts

### Medium Priority
- [ ] lambda/core/orders/create-order-dynamodb.ts
- [ ] lambda/core/reviews/create-review-dynamodb.ts
- [ ] lambda/core/disputes/create-dispute.ts

---

## 🔵 ARCH-002: Implement TODO Items (25+ items)

### Payment Integration
- [ ] lambda/core/wallet/deposit-dynamodb.ts
- [ ] lambda/core/wallet/withdraw-dynamodb.ts

### Order Service Integration
- [ ] lambda/core/disputes/create-dispute.ts
- [ ] lambda/core/disputes/get-dispute-dynamodb.ts
- [ ] lambda/core/disputes/get-disputes-dynamodb.ts

### Notification System
- [ ] lambda/core/disputes/create-dispute.ts
- [ ] lambda/core/disputes/close-dispute-dynamodb.ts
- [ ] lambda/core/disputes/add-evidence.ts
- [ ] lambda/core/disputes/update-dispute-status.ts
- [ ] lambda/core/disputes/send-dispute-message-dynamodb.ts
- [ ] lambda/core/disputes/request-mediation-dynamodb.ts
- [ ] lambda/core/disputes/escalate-dispute-dynamodb.ts
- [ ] lambda/core/shared/services/notification.ts

### WebSocket Implementation
- [ ] lambda/core/shared/services/websocket.service.ts

---

## 🔵 ARCH-006: Large Handlers Refactoring (5 файлов)

### Critical (>500 lines)
- [ ] lambda/core/time-tracking/manage-time-sessions.ts (756 строк)
- [ ] lambda/core/tracking/real-time-location.ts (560 строк)

### High (>200 lines)
- [ ] lambda/core/applications/create-application.ts
- [ ] lambda/core/reviews/create-review-dynamodb.ts
- [ ] lambda/core/disputes/create-dispute.ts

---

## 📊 Статистика

### По Приоритетам
- **🔴 Critical:** 90+ файлов
- **🟡 High:** 60+ файлов
- **🟢 Medium:** 50+ файлов
- **🔵 Low:** 40+ файлов

### По Модулям (Top 10)
1. **Profiles:** 18 файлов
2. **Orders:** 16 файлов
3. **Notifications:** 15 файлов
4. **Chat:** 15 файлов
5. **Services:** 14 файлов
6. **Disputes:** 11 файлов
7. **Reviews:** 11 файлов
8. **Projects:** 11 файлов
9. **Applications:** 10 файлов
10. **Auth:** 10 файлов

### По Типам Изменений
- **Security fixes:** 90+ файлов
- **Consistency improvements:** 150+ файлов
- **Performance optimizations:** 50+ файлов
- **Architecture refactoring:** 40+ файлов

---

## 🎯 Рекомендуемый Порядок

### Week 1: Security (Quick Wins)
1. JWT Secret (40 файлов) - автоматический скрипт
2. CORS (1 файл)
3. Connection Pooling (1 файл)

### Week 2: Security (Auth Migration)
1. Reviews module (10 файлов)
2. Profiles module (12 файлов)
3. Projects module (11 файлов)

### Week 3: Security (Auth Migration + Sanitization)
1. Orders module (10 файлов)
2. Applications module (10 файлов)
3. Add sanitization middleware

### Week 4: Consistency (Response Format)
1. Analytics, Auth, Availability (19 файлов)
2. Calendar, Categories, Chat (21 файл)

### Week 5: Consistency (Response Format)
1. Disputes, Notifications (26 файлов)
2. Orders, Profiles (34 файла)

### Week 6: Consistency (Error Handling + Validation)
1. Add withErrorHandler everywhere
2. Standardize validation
3. Fix logging

### Week 7: Performance (DynamoDB)
1. High priority queries (5 файлов)
2. Medium priority queries (5 файлов)
3. Low priority queries (5 файлов)

### Week 8: Performance (Caching + Pagination)
1. Add caching (10 endpoints)
2. Add pagination (10 endpoints)

### Week 9-10: Architecture (Transactions)
1. Critical operations (5 файлов)
2. Medium operations (3 файла)

### Week 11-12: Architecture (Refactoring + TODO)
1. Large handlers (5 файлов)
2. TODO items (10 items)

---

## 📝 Tracking Progress

### Template для каждого файла

```markdown
- [ ] lambda/core/module/file.ts
  - [ ] Analysis
  - [ ] Implementation
  - [ ] Testing
  - [ ] Code Review
  - [ ] Deployed
  - Assigned: @username
  - PR: #123
  - Notes: ...
```

---

**Последнее обновление:** 2 февраля 2026  
**Всего файлов:** 240+  
**Completed:** 0  
**In Progress:** 0  
**Pending:** 240+
