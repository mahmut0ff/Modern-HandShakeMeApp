# GDPR API Examples

## 🗑️ Delete Account

**Endpoint:** `DELETE /gdpr/account`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "confirmPassword": "user_password",
  "reason": "privacy_concerns",
  "feedback": "I'm concerned about data privacy"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully. Your data has been anonymized and will be permanently removed after 30 days.",
  "operationId": "delete_account_a1b2c3d4",
  "timestamp": "2026-01-31T06:12:53.688Z",
  "affectedRecords": 25
}
```

**Error Responses:**

*Invalid Password (403):*
```json
{
  "error": "Invalid password"
}
```

*Active Orders (400):*
```json
{
  "error": "Cannot delete account with active orders. Please complete or cancel them first."
}
```

*Positive Balance (400):*
```json
{
  "error": "Cannot delete account with positive wallet balance (150). Please withdraw funds first."
}
```

## 📤 Export Data

**Endpoint:** `GET /gdpr/export`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
format=json                    # json or csv
includeFiles=true             # include file download URLs
sections=profile,orders,reviews # specific sections to export
```

**Full URL Example:**
```
GET /gdpr/export?format=json&includeFiles=true&sections=profile,orders,reviews
```

**Success Response (200):**
```json
{
  "exportInfo": {
    "userId": "12345678-1234-1234-1234-123456789012",
    "exportedAt": "2026-01-31T06:12:53.688Z",
    "format": "json",
    "requestedSections": "profile, orders, reviews",
    "dataRetentionPolicy": "Data exported under GDPR Article 20 (Right to Data Portability). Export links valid for 24 hours."
  },
  "profile": {
    "user": {
      "id": "12345678-1234-1234-1234-123456789012",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CLIENT",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "orders": [
    {
      "id": "order_123",
      "title": "Website Development",
      "status": "COMPLETED",
      "amount": 5000,
      "createdAt": "2025-06-01T00:00:00.000Z"
    }
  ],
  "reviews": {
    "given": [
      {
        "id": "review_456",
        "rating": 5,
        "comment": "Excellent work!",
        "createdAt": "2025-06-15T00:00:00.000Z"
      }
    ],
    "received": []
  },
  "downloadUrls": [
    {
      "category": "avatar",
      "originalUrl": "https://bucket.s3.amazonaws.com/users/123/avatar.jpg",
      "downloadUrl": "https://bucket.s3.amazonaws.com/users/123/avatar.jpg?X-Amz-Algorithm=..."
    }
  ],
  "summary": {
    "totalOrders": 1,
    "totalApplications": 0,
    "totalProjects": 0,
    "totalReviews": 1,
    "totalMessages": 0,
    "totalNotifications": 0,
    "totalTransactions": 0,
    "totalPortfolioItems": 0
  }
}
```

**Error Responses:**

*Rate Limited (400):*
```json
{
  "error": "Rate limit exceeded. Please wait 45 minutes before requesting another export."
}
```

*Invalid Sections (400):*
```json
{
  "error": "Invalid export request: Invalid sections: invalid_section"
}
```

## 🔧 Available Export Sections

| Section | Description | Available For |
|---------|-------------|---------------|
| `profile` | User profile and account info | All users |
| `orders` | Orders created or received | All users |
| `applications` | Job applications sent/received | All users |
| `projects` | Project data | All users |
| `reviews` | Reviews given and received | All users |
| `messages` | Chat messages | All users |
| `notifications` | Push notifications history | All users |
| `wallet` | Wallet and transaction history | All users |
| `portfolio` | Portfolio items and images | Masters only |

## 📋 GDPR Compliance Features

### Data Anonymization
- Email: `user@example.com` → `deleted_a1b2c3d4@anonymized.local`
- Name: `John Doe` → `Deleted User`
- Reviews: Personal comments → `[Review from deleted user]`
- All sensitive fields removed from exports

### Data Retention
- User data anonymized immediately
- Archive data kept for 30 days (legal compliance)
- Automatic deletion after retention period
- File cleanup from S3 storage

### Security Features
- Password confirmation required for deletion
- Rate limiting: 1 export per hour per user
- Signed URLs for file downloads (24h expiry)
- Admin alerts for large operations
- Audit logging for all GDPR operations

### User Rights (GDPR Articles)
- **Article 17**: Right to erasure (delete account)
- **Article 20**: Right to data portability (export data)
- **Article 13**: Right to be informed (clear notifications)
- **Article 12**: Right of access (transparent process)

## 🚨 Error Handling

All GDPR endpoints return consistent error format:

```json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-01-31T06:12:53.688Z",
  "operationId": "operation_a1b2c3d4"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors, business logic violations)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (invalid password, insufficient permissions)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 📧 Email Notifications

Users receive email confirmations for:

**Account Deletion:**
- Subject: "Ваш аккаунт был удален - HandShakeMe"
- Sent to original email before anonymization
- Includes deletion timestamp and retention info

**Large Data Export:**
- Subject: "Экспорт ваших данных готов - HandShakeMe"
- Sent for exports with >100 records
- Includes summary of exported data

## 🔍 Admin Monitoring

Admins receive alerts for:
- Account deletions (INFO level)
- Large data exports >1000 records (INFO level)
- GDPR operation failures (ERROR level)
- System errors during processing (ERROR level)

All operations are logged with unique operation IDs for tracking and audit purposes.