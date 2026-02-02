# Security Fixes - Детальные Инструкции

## 🔴 КРИТИЧЕСКОЕ: JWT Secret Hardcoding

### Проблема
40+ файлов используют небезопасный fallback для JWT_SECRET

### Список Затронутых Файлов
- Reviews: 10 файлов
- Profiles: 12 файлов  
- Projects: 11 файлов
- Orders: 5 файлов
- Recommendations: 1 файл
- Shared utils: 1 файл

### Исправление

Заменить:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

На:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set');
}
```

### Скрипт для автоматического исправления

```bash
#!/bin/bash
FILES=$(grep -rl "JWT_SECRET.*your-secret-key" lambda/core/)
for file in $FILES; do
  echo "Fixing $file"
  # Замена через sed
done
```

---

## 🔴 Централизация Authentication

### Миграция на withAuth Middleware

#### До:
```typescript
const token = event.headers.Authorization?.replace('Bearer ', '');
const decoded = jwt.verify(token, JWT_SECRET);
```

#### После:
```typescript
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';

async function handler(event: AuthenticatedEvent) {
  const userId = event.auth.userId;
  // ...
}

export const handler = withErrorHandler(withAuth(handler));
```

---

## 🟡 Input Sanitization

### Создать middleware для санитизации

```typescript
// lambda/core/shared/middleware/sanitization.ts
export function withSanitization(handler, config) {
  return async (event, context) => {
    if (event.body) {
      const body = JSON.parse(event.body);
      const sanitized = sanitizeObject(body, config);
      event.body = JSON.stringify(sanitized);
    }
    return handler(event, context);
  };
}
```

### Использование

```typescript
export const handler = withErrorHandler(
  withSanitization(
    withAuth(createOrderHandler),
    {
      fields: {
        html: ['description'],
        text: ['title', 'address']
      }
    }
  )
);
```

---

## 🟡 Rate Limiting

### Использовать Redis для rate limiting

```typescript
// lambda/core/shared/services/rate-limiter.service.ts
export class RateLimiterService {
  async checkRateLimit(identifier: string, config: RateLimitConfig) {
    const redis = await getRedisClient();
    // Sliding window algorithm using Redis sorted sets
    // ...
  }
}
```

---

## 🟡 CORS Configuration

### Обновить security middleware

```typescript
cors: {
  enabled: true,
  origins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true
}
```

### Environment Variables

```bash
ALLOWED_ORIGINS=https://app.handshakeme.com,https://admin.handshakeme.com
```
