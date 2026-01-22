# Middleware Documentation

## Request Transformer Middleware

The request transformer middleware automatically converts incoming API requests from snake_case (mobile/REST API standard) to camelCase (backend/database standard) and converts lowercase enums to UPPERCASE.

### Usage

```typescript
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { withErrorHandler } from '@/shared/middleware/errorHandler';

async function createOrderHandler(event: APIGatewayProxyEvent) {
  // Request body is already transformed to camelCase
  const body = JSON.parse(event.body || '{}');
  
  // body.budgetType is now 'FIXED' (was 'fixed')
  // body.requiredSkills is now [1, 2, 3] (was required_skills)
  
  // ... your handler logic
}

// Apply middleware (order matters: transform first, then error handling)
export const handler = withErrorHandler(
  withRequestTransform(createOrderHandler)
);
```

### Features

- **Automatic snake_case → camelCase conversion**: All request body keys are converted
- **Enum conversion**: Lowercase enums are converted to UPPERCASE for database operations
- **Nested object support**: Recursively transforms nested objects and arrays
- **Query parameter preservation**: Query params are preserved by default (can be configured)
- **Multipart/form-data support**: Skips transformation for file uploads
- **Error logging**: Logs transformation errors for debugging

### Options

```typescript
interface TransformOptions {
  excludeKeys?: string[];           // Keys to exclude from transformation
  preserveQueryParams?: boolean;    // Preserve query params (default: true)
  transformEnums?: boolean;         // Transform enums (default: true)
}

// Example with options
export const handler = withRequestTransform(myHandler, {
  excludeKeys: ['raw_data'],
  preserveQueryParams: true,
  transformEnums: true,
});
```

### Examples

#### Basic Request Transformation

**Mobile sends:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890"
}
```

**Handler receives:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

#### Enum Conversion

**Mobile sends:**
```json
{
  "budget_type": "fixed",
  "status": "active",
  "role": "client"
}
```

**Handler receives:**
```json
{
  "budgetType": "FIXED",
  "status": "ACTIVE",
  "role": "CLIENT"
}
```

#### Nested Objects

**Mobile sends:**
```json
{
  "user_data": {
    "first_name": "Jane",
    "contact_info": {
      "phone_number": "+1234567890"
    }
  }
}
```

**Handler receives:**
```json
{
  "userData": {
    "firstName": "Jane",
    "contactInfo": {
      "phoneNumber": "+1234567890"
    }
  }
}
```

## Error Handler Middleware

See `errorHandler.ts` for error handling middleware documentation.

## Auth Middleware

See `auth.ts` for authentication middleware documentation.
