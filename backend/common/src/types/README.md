# Common Types

This directory contains shared TypeScript types, enums, and interfaces used across all microservices in the project.

## Overview

The `common.ts` file provides a centralized location for type definitions that are used by multiple services, ensuring consistency and type safety across the entire application.

## Categories

### 1. Environment & Configuration
- `Environment`: Application environment types (development, production, test, staging)
- `LogLevel`: Logging levels (error, warn, info, debug, verbose)

### 2. User & Authentication
- `UserRole`: User roles for authorization (admin, user, moderator, guest)
- `UserStatus`: User account statuses (active, inactive, suspended, pending, deleted)
- `AuthProvider`: Authentication provider types (local, google, github, facebook, apple)
- `JwtPayload`: JWT token payload structure
- `AuthContext`: Authentication context for requests

### 3. HTTP & API
- `HttpMethod`: HTTP request methods
- `ResponseMetadata`: Additional context for API responses

### 4. Pagination & Filtering
- `PaginationParams`: Parameters for paginated requests
- `PaginationMeta`: Metadata included in paginated responses
- `PaginatedData`: Wrapper for paginated data
- `SortOrder`: Ascending or descending sort order
- `SortParams`: Parameters for sorting queries
- `FilterOperator`: Operators for filtering (eq, ne, gt, gte, lt, lte, like, in, etc.)
- `FilterParam`: Structure for filter parameters

### 5. Database & Entities
- `Timestamps`: Standard created/updated timestamp fields
- `SoftDeletable`: Soft delete functionality
- `Auditable`: Audit trail fields (who created/updated)

### 6. Events & Messaging
- `EventType`: Event types for inter-service communication
- `BaseEvent`: Base structure for all events
- `Event<T>`: Event with typed payload

### 7. Jobs & Workers
- `JobStatus`: Status of background jobs (pending, processing, completed, failed, etc.)
- `JobPriority`: Priority levels for job queue
- `Job`: Complete job structure

### 8. Dashboard & Analytics
- `WidgetType`: Types of dashboard widgets (chart, table, metric, text, map, custom)
- `ChartType`: Chart visualization types (line, bar, pie, area, scatter, radar)
- `TimeRange`: Time range options for analytics
- `AggregationType`: Metric aggregation methods (sum, avg, min, max, count, etc.)

### 9. Notifications
- `NotificationType`: Notification types (info, success, warning, error)
- `NotificationChannel`: Channels for sending notifications (email, sms, push, in_app, webhook)
- `Notification`: Complete notification structure

### 10. File & Media
- `FileType`: Types of files (image, video, audio, document, archive, other)
- `FileMetadata`: Metadata for uploaded files

### 11. Validation & Constraints
- `ValidationError`: Structure for validation error details
- `BulkOperationResult`: Result of bulk operations with success/failure counts

### 12. Service Health & Monitoring
- `HealthStatus`: Service health status (healthy, degraded, unhealthy)
- `HealthCheck`: Health check response structure
- `DependencyHealth`: Health information for service dependencies

### 13. Utility Types
TypeScript utility types for advanced type manipulation:
- `DeepPartial<T>`: Make all properties optional recursively
- `DeepRequired<T>`: Make all properties required recursively
- `KeysOfType<T, U>`: Extract keys of specific type
- `OmitByType<T, U>`: Omit properties by type
- `Constructor<T>`: Constructor type
- `AbstractConstructor<T>`: Abstract constructor type
- `AsyncFunction<T>`: Async function type
- `Nullable<T>`: T | null
- `Optional<T>`: T | undefined
- `Maybe<T>`: T | null | undefined

## Usage

Import the types you need from the common package:

```typescript
import { 
  UserRole, 
  UserStatus, 
  EventType, 
  JobStatus,
  PaginationParams,
  PaginatedData 
} from '@common';
```

Or import specific categories:

```typescript
import type { 
  AuthContext, 
  JwtPayload 
} from '@common/types/common';
```

## Best Practices

1. **Use enums for fixed sets of values**: This provides type safety and autocomplete support
2. **Leverage utility types**: Use `DeepPartial`, `Maybe`, etc. for cleaner type definitions
3. **Keep types generic**: These types should be general enough to work across all services
4. **Document your types**: Add JSDoc comments for clarity
5. **Extend when needed**: Services can extend these base types for specific requirements

## Examples

### Using Auth Types
```typescript
function validateUser(context: AuthContext): boolean {
  return context.role === UserRole.Admin || context.role === UserRole.Moderator;
}
```

### Using Pagination
```typescript
async function getUsers(params: PaginationParams): Promise<PaginatedData<User>> {
  const users = await userRepository.find(params);
  return {
    items: users,
    meta: {
      currentPage: params.page,
      pageSize: params.limit,
      // ... other meta fields
    }
  };
}
```

### Using Events
```typescript
const event: Event<UserCreatedPayload> = {
  id: uuid(),
  type: EventType.UserCreated,
  timestamp: new Date(),
  source: 'api-gateway',
  payload: { userId, email },
  correlationId: requestId
};
```

### Using Jobs
```typescript
const job: Job = {
  id: uuid(),
  type: 'process-data',
  status: JobStatus.Pending,
  priority: JobPriority.High,
  payload: { dataId: '123' },
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date()
};
```

## Related Files

- `src/utils/response.ts`: Response utility functions (uses some of these types)
- `src/entities/`: TypeORM entities (implement interfaces like Timestamps, Auditable)
- `src/dto/`: Data transfer objects (use these types for validation)
