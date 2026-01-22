# Master Services Management API

This module provides comprehensive CRUD operations for master services management, enabling masters to create, list, update, and delete their service offerings.

## Overview

The Master Services Management system allows masters to:
- Create new services with pricing, units, and categories
- List their services with filtering and pagination
- Update existing services including pricing and availability
- Delete or deactivate services
- Manage service categories and units

## API Endpoints

### POST /masters/services
Create a new service for the authenticated master.

**Request Body:**
```json
{
  "name": "Web Development",
  "description": "Full-stack web development services",
  "priceFrom": 50,
  "priceTo": 100,
  "unit": "HOUR",
  "categoryId": "cat-123"
}
```

**Response (201):**
```json
{
  "id": "service-123",
  "name": "Web Development",
  "description": "Full-stack web development services",
  "priceFrom": 50,
  "priceTo": 100,
  "unit": "HOUR",
  "category": {
    "id": "cat-123",
    "name": "IT Services"
  },
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### GET /masters/services
List services with optional filtering and pagination.

**Query Parameters:**
- `masterId` (optional): UUID of the master (defaults to authenticated user)
- `categoryId` (optional): Filter by category UUID
- `isActive` (optional): Filter by active status ("true" or "false")
- `includeInactive` (optional): Include inactive services for own services ("true" or "false")
- `limit` (optional): Number of results per page (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response (200):**
```json
{
  "services": [
    {
      "id": "service-123",
      "name": "Web Development",
      "description": "Full-stack web development services",
      "priceFrom": 50,
      "priceTo": 100,
      "unit": "HOUR",
      "category": {
        "id": "cat-123",
        "name": "IT Services"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  },
  "stats": {
    "total": 1,
    "active": 1,
    "inactive": 0,
    "averagePrice": 75
  }
}
```

### PUT /masters/services/{id}
Update an existing service.

**Path Parameters:**
- `id`: UUID of the service to update

**Request Body (all fields optional):**
```json
{
  "name": "Advanced Web Development",
  "description": "Full-stack web development with modern frameworks",
  "priceFrom": 60,
  "priceTo": 120,
  "unit": "HOUR",
  "categoryId": "cat-456",
  "isActive": false
}
```

**Response (200):**
```json
{
  "id": "service-123",
  "name": "Advanced Web Development",
  "description": "Full-stack web development with modern frameworks",
  "priceFrom": 60,
  "priceTo": 120,
  "unit": "HOUR",
  "category": {
    "id": "cat-456",
    "name": "Advanced IT Services"
  },
  "isActive": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

### DELETE /masters/services/{id}
Delete or deactivate a service.

**Path Parameters:**
- `id`: UUID of the service to delete

**Query Parameters:**
- `force` (optional): Set to "true" for hard delete, otherwise soft delete (default: soft delete)

**Response (200):**
```json
{
  "message": "Service deactivated successfully",
  "serviceId": "service-123",
  "action": "deactivated"
}
```

## Service Units

The following service units are supported:
- `HOUR` - Hourly rate
- `PROJECT` - Per project pricing
- `SQUARE_METER` - Per square meter (for area-based services)
- `ITEM` - Per item/piece
- `DAY` - Daily rate

## Validation Rules

### Service Creation/Update
- **Name**: 3-100 characters, required for creation
- **Description**: Maximum 500 characters, optional
- **Price From**: Must be positive number, required for creation
- **Price To**: Must be positive and >= Price From, optional
- **Unit**: Must be one of the supported units, required for creation
- **Category ID**: Must be valid UUID of existing category, required for creation

### Business Rules
- Masters can only manage their own services
- Service names must be unique per master
- Services referenced in active orders cannot be hard deleted
- Price ranges must be logical (priceTo >= priceFrom)
- Categories must exist before being assigned to services

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Service name must be at least 3 characters",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-123"
}
```

### 401 Unauthorized
```json
{
  "code": "UNAUTHORIZED",
  "message": "Invalid token",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-123"
}
```

### 403 Forbidden
```json
{
  "code": "FORBIDDEN",
  "message": "Only masters can create services",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-123"
}
```

### 404 Not Found
```json
{
  "code": "NOT_FOUND",
  "message": "Service category not found",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-123"
}
```

### 409 Conflict
```json
{
  "code": "CONFLICT",
  "message": "Service with this name already exists",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-123"
}
```

### 500 Internal Server Error
```json
{
  "code": "INTERNAL_ERROR",
  "message": "Failed to create service",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-123"
}
```

## Caching Strategy

The service management system implements intelligent caching:

### Cache Keys
- `master:services:{masterId}:*` - All service-related data for a master
- `master:profile:{masterId}:*` - Master profile data (invalidated when services change)

### Cache TTL
- Service listings: 5 minutes (300 seconds)
- Service details: 10 minutes (600 seconds)

### Cache Invalidation
Cache is automatically invalidated when:
- Services are created, updated, or deleted
- Master profile information changes
- Service categories are modified

## Database Schema

### MasterService Table
```sql
CREATE TABLE master_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_from DECIMAL(10,2) NOT NULL,
    price_to DECIMAL(10,2),
    unit service_unit_enum NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_master_services_master_active ON master_services(master_id, is_active);
CREATE INDEX idx_master_services_category_active ON master_services(category_id, is_active);
CREATE UNIQUE INDEX idx_master_services_master_name ON master_services(master_id, name) WHERE is_active = true;
```

### ServiceUnit Enum
```sql
CREATE TYPE service_unit_enum AS ENUM (
    'HOUR',
    'PROJECT', 
    'SQUARE_METER',
    'ITEM',
    'DAY'
);
```

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (master_id, category_id, is_active)
- Partial unique index on active services to prevent name conflicts
- Efficient pagination using LIMIT/OFFSET with proper ordering

### Caching Strategy
- Redis caching for frequently accessed service lists
- Cache warming for popular masters
- Intelligent cache invalidation to maintain data consistency

### Query Optimization
- Use of database indexes for filtering and sorting
- Efficient JOIN operations with proper relationship modeling
- Pagination to limit result set sizes

## Security Features

### Authentication & Authorization
- JWT token validation for all endpoints
- Role-based access control (masters only)
- Resource ownership validation

### Input Validation
- Comprehensive input sanitization using Zod schemas
- SQL injection prevention through parameterized queries
- XSS protection through proper data encoding

### Data Protection
- Sensitive data encryption at rest
- Secure API communication over HTTPS
- Audit logging for all service modifications

## Testing

### Unit Tests
- Comprehensive test coverage for all business logic
- Mock implementations for external dependencies
- Property-based testing for data validation

### Integration Tests
- End-to-end API testing
- Database integration testing
- Cache behavior validation

### Performance Tests
- Load testing for high-traffic scenarios
- Database query performance testing
- Cache hit ratio optimization

## Monitoring & Observability

### Logging
- Structured logging for all operations
- Error tracking and alerting
- Performance metrics collection

### Metrics
- API response times
- Database query performance
- Cache hit/miss ratios
- Error rates by endpoint

### Alerts
- High error rates
- Slow response times
- Database connection issues
- Cache failures

## Deployment

### Infrastructure Requirements
- AWS Lambda runtime: Node.js 18.x
- PostgreSQL database with proper indexes
- Redis cache cluster
- S3 bucket for file storage (if needed)

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://cache-host:6379
JWT_SECRET=your-jwt-secret
AWS_REGION=us-east-1
```

### Deployment Steps
1. Build TypeScript code: `npm run build`
2. Run database migrations: `npx prisma migrate deploy`
3. Deploy Lambda functions: `serverless deploy`
4. Verify API endpoints are accessible
5. Run smoke tests to validate functionality

## Future Enhancements

### Planned Features
- Service templates for quick setup
- Bulk service import/export
- Service analytics and insights
- Advanced pricing models (tiered, dynamic)
- Service recommendations based on demand

### Performance Improvements
- GraphQL API for flexible queries
- Database read replicas for scaling
- Advanced caching strategies
- CDN integration for static assets

### Integration Opportunities
- Third-party pricing APIs
- Service marketplace integration
- Payment gateway connections
- CRM system synchronization