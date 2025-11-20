# Rate Limiting Implementation

## Overview

Rate limiting has been implemented to prevent abuse and ensure fair usage of the API. The system uses `@nestjs/throttler` with a custom GraphQL guard to track requests per user or IP address.

## Configuration

### Default Rate Limits

Located in `backend/api-gateway/src/config/rate-limit.config.ts`:

- **Short**: 10 requests per second
- **Medium**: 100 requests per minute  
- **Long**: 1000 requests per hour

### Health Check Exception

Health check endpoints (`/health`) are excluded from rate limiting to ensure monitoring systems can always check service status.

## Endpoint-Specific Limits

### Authentication Endpoints

**Login** (`@Throttle(RateLimits.LOGIN)`)
- Limit: 3 attempts per minute
- Purpose: Prevent brute force attacks

**Registration** (`@Throttle(RateLimits.REGISTER)`)
- Limit: 3 registrations per 5 minutes
- Purpose: Prevent spam accounts

**Refresh Token** (`@Throttle(RateLimits.AUTH)`)
- Limit: 5 requests per minute
- Purpose: Prevent token refresh abuse

### AI Endpoints

**Chat** (`@Throttle(RateLimits.AI_CHAT)`)
- Limit: 10 messages per minute
- Purpose: Control AI service usage

**Analysis** (`@Throttle(RateLimits.AI_ANALYSIS)`)
- Limit: 5 analyses per minute
- Purpose: Prevent resource-intensive operations

**Summary Generation** (`@Throttle(RateLimits.AI_SUMMARY)`)
- Limit: 5 summaries per minute
- Purpose: Control AI processing load

### Standard Endpoints

**Dashboard** (`@Throttle(RateLimits.DASHBOARD)`)
- Limit: 50 requests per minute

**Tasks** (`@Throttle(RateLimits.TASKS)`)
- Limit: 100 requests per minute

**User Operations** (`@Throttle(RateLimits.USER)`)
- Limit: 100 requests per minute

## Implementation Details

### Custom GraphQL Throttler Guard

`GqlThrottlerGuard` extends the base `ThrottlerGuard` to:

1. Extract request context from GraphQL operations
2. Track limits per authenticated user (by user ID)
3. Fall back to IP-based tracking for unauthenticated requests

```typescript
// Example: User-based tracking
throttle:user:{userId}:{name}:{suffix}

// Example: IP-based tracking  
throttle:ip:{ipAddress}:{name}:{suffix}
```

### Global Application

The guard is applied globally via `APP_GUARD` in `app.module.ts`, ensuring all GraphQL resolvers are protected by default.

## Adding Rate Limits to New Endpoints

To add rate limiting to a new resolver:

```typescript
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../config/rate-limit.config';

@Resolver()
export class MyResolver {
  @Throttle(RateLimits.CUSTOM_LIMIT)
  @Query(() => MyType)
  async myQuery() {
    // Your implementation
  }
}
```

To skip rate limiting for specific endpoints:

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Resolver()
export class MyResolver {
  @SkipThrottle()
  @Query(() => MyType)
  async publicQuery() {
    // This query won't be rate limited
  }
}
```

## Custom Rate Limit Configuration

To add a new rate limit configuration in `rate-limit.config.ts`:

```typescript
export const RateLimits = {
  // ... existing limits
  CUSTOM_OPERATION: { 
    short: { limit: 20, ttl: 60000 } // 20 requests per minute
  },
};
```

## Response Behavior

When rate limit is exceeded, the API returns:

```json
{
  "errors": [
    {
      "message": "ThrottlerException: Too Many Requests",
      "extensions": {
        "code": "THROTTLED"
      }
    }
  ]
}
```

HTTP Status Code: `429 Too Many Requests`

## Monitoring

Rate limit events are tracked using the throttler's internal storage. For production environments, consider:

1. Using Redis for distributed rate limiting across multiple instances
2. Logging throttle events for abuse detection
3. Implementing alerts for repeated violations

## Testing

Rate limiting tests are located in `backend/api-gateway/tests/rate-limit.spec.ts`.

Run tests with:
```bash
cd backend/api-gateway
pnpm test rate-limit.spec.ts
```

## Production Considerations

### Redis Storage (Recommended for Production)

For distributed deployments, use Redis as the storage backend:

```bash
pnpm add @nestjs/throttler-storage-redis ioredis
```

Update `rate-limit.config.ts`:

```typescript
import { ThrottlerStorageRedisService } from '@nestjs/throttler-storage-redis';
import Redis from 'ioredis';

export const rateLimitConfig: ThrottlerModuleOptions = {
  throttlers: [/* ... */],
  storage: new ThrottlerStorageRedisService(
    new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    })
  ),
};
```

### Environment-Based Configuration

Consider different limits for different environments:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const rateLimitConfig = {
  throttlers: [
    {
      name: 'short',
      ttl: 1000,
      limit: isDevelopment ? 100 : 10, // More lenient in dev
    },
    // ...
  ],
};
```

## Security Best Practices

1. **Monitor for abuse patterns**: Track repeated limit violations
2. **Use authenticated tracking**: Prefer user ID over IP when possible
3. **Adjust limits based on usage**: Review and tune limits regularly
4. **Consider tiered limits**: Different limits for different user tiers
5. **Implement circuit breakers**: For downstream service protection

## Related Files

- `backend/api-gateway/src/config/rate-limit.config.ts` - Rate limit configuration
- `backend/api-gateway/src/guards/gql-throttler.guard.ts` - Custom GraphQL guard
- `backend/api-gateway/src/app.module.ts` - Global guard setup
- `backend/api-gateway/src/modules/auth/auth.resolve.ts` - Auth resolver with limits
- `backend/api-gateway/src/modules/ai/ai.resolver.ts` - AI resolver with limits
- `backend/api-gateway/tests/rate-limit.spec.ts` - Rate limiting tests
