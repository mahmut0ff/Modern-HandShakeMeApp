# Authorization Header Fix

## Issue
Notifications endpoint (and other endpoints) were returning 401 "Authorization token required" error even when users were logged in.

## Root Cause
The Lambda handlers were checking for `event.headers.Authorization` (capital A), but API Gateway may normalize headers to lowercase (`authorization`). This caused the token extraction to fail.

## Solution

### 1. Created Utility Function
Created `lambda/core/shared/utils/auth-header.ts` with:
- `extractAuthToken()` - Extracts Bearer token from headers (case-insensitive)
- `getHeader()` - Gets any header value (case-insensitive)

### 2. Updated Notification Handlers
Updated all notification handlers to use the new utility:
- `list-notifications-dynamodb.ts`
- `mark-read-dynamodb.ts`
- `mark-all-read-dynamodb.ts`
- `delete-all-dynamodb.ts`
- `get-unread-count-dynamodb.ts`

### 3. Implementation Details

**Before:**
```typescript
const token = event.headers.Authorization?.replace('Bearer ', '');
```

**After:**
```typescript
import { extractAuthToken } from '@/shared/utils/auth-header';

const token = extractAuthToken(event);
```

The utility function:
```typescript
export function extractAuthToken(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Remove 'Bearer ' prefix (case-insensitive)
  const token = authHeader.replace(/^Bearer\s+/i, '');
  
  return token || null;
}
```

## Files Changed

### Created
- `lambda/core/shared/utils/auth-header.ts`

### Updated
- `lambda/core/notifications/list-notifications-dynamodb.ts`
- `lambda/core/notifications/mark-read-dynamodb.ts`
- `lambda/core/notifications/mark-all-read-dynamodb.ts`
- `lambda/core/notifications/delete-all-dynamodb.ts`

## Other Handlers with Same Issue

The following handlers also have the same issue and should be updated:
- `lambda/core/services/update-service-dynamodb.ts`
- `lambda/core/services/toggle-service-status.ts`
- `lambda/core/services/my-services-dynamodb.ts`
- `lambda/core/services/delete-service-dynamodb.ts`
- `lambda/core/services/create-service-dynamodb.ts`
- `lambda/core/services/reorder-services.ts`
- `lambda/core/profiles/update-user-dynamodb.ts`

## Testing

After deploying these changes:
1. Test notifications list endpoint
2. Test mark as read
3. Test mark all as read
4. Test delete all notifications
5. Verify token is properly extracted in logs

## Why This Happens

API Gateway behavior with headers:
- In some configurations, API Gateway normalizes headers to lowercase
- In Lambda proxy integration, headers may be passed as-is or normalized
- The behavior can vary based on:
  - API Gateway version
  - Integration type
  - CloudFront in front of API Gateway
  - Custom domain configuration

## Best Practice

Always check headers case-insensitively when working with API Gateway Lambda integrations. Use the utility function for consistency across all handlers.

## Alternative Solution

Instead of manually checking headers, use the `withAuth` middleware which already handles this correctly:

```typescript
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';

async function handler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  // ... rest of handler
}

export const handler = withErrorHandler(withAuth(handlerFunction));
```

The `withAuth` middleware already handles case-insensitive header checking and provides a clean `event.auth` object.

## Recommendation

For new handlers, prefer using the `withAuth` middleware instead of manually extracting tokens. For existing handlers that can't be easily refactored, use the `extractAuthToken` utility.
