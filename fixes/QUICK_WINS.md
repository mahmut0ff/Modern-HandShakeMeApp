# Quick Wins - Быстрые Улучшения

Эти изменения можно сделать быстро и получить немедленный эффект.

---

## 🔥 1. Исправить JWT Secret (30 минут)

### Скрипт для автоматического исправления

```bash
#!/bin/bash
# Файл: scripts/fix-jwt-secret.sh

echo "Fixing JWT_SECRET hardcoding..."

# Найти все файлы
FILES=$(grep -rl "JWT_SECRET.*your-secret-key" lambda/core/)

# Счетчик
COUNT=0

for file in $FILES; do
  echo "Fixing: $file"
  
  # Создать backup
  cp "$file" "$file.bak"
  
  # Заменить паттерн
  sed -i "s/const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';/const JWT_SECRET = process.env.JWT_SECRET;\nif (!JWT_SECRET) {\n  throw new Error('FATAL: JWT_SECRET environment variable is not set');\n}/g" "$file"
  
  COUNT=$((COUNT + 1))
done

echo "Fixed $COUNT files"
echo "Backups saved with .bak extension"
```

### Запуск

```bash
chmod +x scripts/fix-jwt-secret.sh
./scripts/fix-jwt-secret.sh
```

---

## 🔥 2. Добавить Logging Helper (15 минут)

### Создать глобальный replace script

```bash
#!/bin/bash
# Файл: scripts/fix-console-logs.sh

echo "Replacing console.* with logger.*..."

# Найти все файлы с console.log/error/warn
FILES=$(grep -rl "console\.\(log\|error\|warn\)" lambda/core/ --include="*.ts" --exclude-dir=node_modules)

for file in $FILES; do
  echo "Fixing: $file"
  
  # Backup
  cp "$file" "$file.bak"
  
  # Добавить import если нет
  if ! grep -q "import.*logger.*from.*utils/logger" "$file"; then
    sed -i "1i import { logger } from '../shared/utils/logger';" "$file"
  fi
  
  # Заменить console.log на logger.info
  sed -i "s/console\.log(/logger.info(/g" "$file"
  
  # Заменить console.error на logger.error
  sed -i "s/console\.error(/logger.error(/g" "$file"
  
  # Заменить console.warn на logger.warn
  sed -i "s/console\.warn(/logger.warn(/g" "$file"
done

echo "Done! Check files and remove .bak if OK"
```

---

## 🔥 3. Стандартизировать Response Format (1 час)

### Создать helper для миграции

```typescript
// scripts/migrate-response-format.ts
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const files = glob.sync('lambda/core/**/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Заменить success() на successResponse()
  if (content.includes("from '../shared/utils/response'")) {
    content = content.replace(
      "from '../shared/utils/response'",
      "from '../shared/utils/unified-response'"
    );
    
    content = content.replace(/\bsuccess\(/g, 'successResponse(');
    content = content.replace(/\berror\(/g, 'errorResponse(');
    content = content.replace(/\bbadRequest\(/g, 'badRequestResponse(');
    content = content.replace(/\bunauthorized\(/g, 'unauthorizedResponse(');
    content = content.replace(/\bforbidden\(/g, 'forbiddenResponse(');
    content = content.replace(/\bnotFound\(/g, 'notFoundResponse(');
    
    modified = true;
  }

  // Заменить прямые response objects
  const directResponsePattern = /return\s+{\s*statusCode:\s*(\d+),\s*body:\s*JSON\.stringify\(([^)]+)\)\s*}/g;
  if (directResponsePattern.test(content)) {
    content = content.replace(directResponsePattern, (match, statusCode, body) => {
      if (statusCode === '200' || statusCode === '201') {
        return `return successResponse(${body})`;
      } else if (statusCode === '400') {
        return `return badRequestResponse(${body})`;
      } else if (statusCode === '401') {
        return `return unauthorizedResponse(${body})`;
      } else if (statusCode === '404') {
        return `return notFoundResponse(${body})`;
      }
      return match;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
  }
}
```

---

## 🔥 4. Добавить Validation Helper (30 минут)

### Создать wrapper для всех schemas

```typescript
// lambda/core/shared/utils/validation-wrapper.ts
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler';

/**
 * Validate data with Zod schema
 * Throws ValidationError on failure
 */
export function validate<T>(schema: z.ZodSchema<T>, data: any): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, params: any): T {
  return validate(schema, params || {});
}

/**
 * Validate path parameters
 */
export function validatePath<T>(schema: z.ZodSchema<T>, params: any): T {
  if (!params) {
    throw new ValidationError('Missing path parameters', []);
  }
  return validate(schema, params);
}
```

### Использование

```typescript
// До
const data = createOrderSchema.parse(JSON.parse(event.body || '{}'));

// После
const data = validate(createOrderSchema, JSON.parse(event.body || '{}'));
```

---

## 🔥 5. Добавить Request ID Tracking (20 минут)

### Обновить logger

```typescript
// lambda/core/shared/utils/logger.ts
import { Context } from 'aws-lambda';

class Logger {
  private requestId?: string;

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  private formatMessage(level: string, message: string, context?: any) {
    return JSON.stringify({
      level,
      message,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  info(message: string, context?: any) {
    console.log(this.formatMessage('info', message, context));
  }

  error(message: string, error?: any, context?: any) {
    console.error(this.formatMessage('error', message, {
      error: error?.message || error,
      stack: error?.stack,
      ...context
    }));
  }

  warn(message: string, context?: any) {
    console.warn(this.formatMessage('warn', message, context));
  }
}

export const logger = new Logger();

// Helper to set request ID from context
export function setRequestId(context: Context) {
  logger.setRequestId(context.awsRequestId);
}
```

### Использование в middleware

```typescript
// lambda/core/shared/middleware/requestTransform.ts
import { setRequestId } from '../utils/logger';

export function withRequestTransform(handler: LambdaHandler): LambdaHandler {
  return async (event, context) => {
    // Set request ID for logging
    setRequestId(context);
    
    logger.info('Incoming request', {
      path: event.path,
      httpMethod: event.httpMethod
    });

    return await handler(event, context);
  };
}
```

---

## 🔥 6. Добавить Health Check (10 минут)

### Простой health check endpoint

```typescript
// lambda/core/health/simple-health-check.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown'
    })
  };
}
```

### Добавить в API Gateway

```hcl
# lambda/terraform/api-routes-health.tf
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}
```

---

## 🔥 7. Добавить Error Codes (15 минут)

### Создать enum для error codes

```typescript
// lambda/core/shared/types/error-codes.ts
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business Logic
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  ORDER_NOT_ACTIVE = 'ORDER_NOT_ACTIVE',
  APPLICATION_ALREADY_EXISTS = 'APPLICATION_ALREADY_EXISTS',
  PROJECT_NOT_COMPLETED = 'PROJECT_NOT_COMPLETED',
  
  // Rate Limiting
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.UNAUTHORIZED]: 'Authentication required',
    [ErrorCode.FORBIDDEN]: 'Access denied',
    [ErrorCode.TOKEN_EXPIRED]: 'Token has expired',
    [ErrorCode.TOKEN_INVALID]: 'Invalid token',
    [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
    [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ErrorCode.NOT_FOUND]: 'Resource not found',
    [ErrorCode.ALREADY_EXISTS]: 'Resource already exists',
    [ErrorCode.CONFLICT]: 'Resource conflict',
    [ErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient funds',
    [ErrorCode.ORDER_NOT_ACTIVE]: 'Order is not active',
    [ErrorCode.APPLICATION_ALREADY_EXISTS]: 'Application already exists',
    [ErrorCode.PROJECT_NOT_COMPLETED]: 'Project must be completed first',
    [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
    [ErrorCode.DATABASE_ERROR]: 'Database error',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error'
  };
  
  return messages[code] || 'Unknown error';
}
```

### Использование

```typescript
import { ErrorCode, getErrorMessage } from '@/shared/types/error-codes';

// В handler
if (!order) {
  return errorResponse(
    ErrorCode.NOT_FOUND,
    getErrorMessage(ErrorCode.NOT_FOUND),
    404
  );
}

if (order.status !== 'ACTIVE') {
  return errorResponse(
    ErrorCode.ORDER_NOT_ACTIVE,
    getErrorMessage(ErrorCode.ORDER_NOT_ACTIVE),
    400
  );
}
```

---

## 🔥 8. Добавить Pagination Helper (20 минут)

### Создать универсальный helper

```typescript
// lambda/core/shared/utils/pagination.ts
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function parsePaginationParams(
  queryParams: any
): PaginationParams {
  return {
    page: parseInt(queryParams?.page || '1', 10),
    pageSize: Math.min(parseInt(queryParams?.pageSize || '20', 10), 100),
    sortBy: queryParams?.sortBy,
    sortOrder: queryParams?.sortOrder === 'desc' ? 'desc' : 'asc'
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  totalCount: number,
  params: PaginationParams
): PaginatedResult<T> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    }
  };
}
```

### Использование

```typescript
// В handler
const params = parsePaginationParams(event.queryStringParameters);

const { items, count } = await orderRepo.findAll({
  limit: params.pageSize,
  offset: (params.page - 1) * params.pageSize,
  sortBy: params.sortBy,
  sortOrder: params.sortOrder
});

const result = createPaginatedResponse(items, count, params);

return successResponse(result);
```

---

## 🔥 9. Добавить DynamoDB Connection Pooling (5 минут)

### Обновить dynamodb-client.ts

```typescript
// lambda/core/shared/db/dynamodb-client.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// ✅ Создать клиент ОДИН РАЗ вне handler
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  maxAttempts: 3,
});

export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Клиент будет переиспользоваться между invocations
```

---

## 🔥 10. Добавить Environment Validation (10 минут)

### Создать validation на старте

```typescript
// lambda/core/shared/utils/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  AWS_REGION: z.string(),
  DYNAMODB_TABLE: z.string(),
  JWT_SECRET: z.string().min(32),
  S3_BUCKET: z.string(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
}

// Вызвать при старте Lambda
validateEnvironment();
```

---

## Итого: 4-5 часов работы

Эти 10 quick wins можно сделать за один день и получить:
- ✅ Безопасность (JWT secret)
- ✅ Лучшее логирование
- ✅ Консистентные responses
- ✅ Валидация везде
- ✅ Request tracking
- ✅ Health checks
- ✅ Error codes
- ✅ Pagination
- ✅ Connection pooling
- ✅ Environment validation

**ROI: Высокий** - минимальные усилия, максимальный эффект!
