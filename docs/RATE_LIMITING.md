# Rate Limiting

Rate limiting for the API Gateway, built on `@nestjs/throttler` with a custom GraphQL-aware guard, to prevent abuse and ensure fair usage.

## Overview

- Tracks limits per **authenticated user** (by user ID) when available, falling back to **IP address** for anonymous requests.
- Health check endpoints (`/health`) are excluded from limiting.
- Applied globally via `APP_GUARD` in `app.module.ts`, so all GraphQL resolvers are protected by default.

## Global Tiers

| Tier | Limit | Window |
|------|-------|--------|
| Short | 10 | 1 second |
| Medium | 100 | 1 minute |
| Long | 1000 | 1 hour |

## Endpoint-Specific Limits

### Authentication

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| Login | 3 | 1 minute | Brute-force protection |
| Registration | 3 | 5 minutes | Spam-account prevention |
| Refresh Token | 5 | 1 minute | Prevent refresh abuse |

### AI Operations

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| Chat | 10 | 1 minute | Control AI service usage |
| Analysis | 5 | 1 minute | Prevent resource-intensive abuse |
| Summary | 5 | 1 minute | Control AI processing load |

### Standard Operations

| Endpoint | Limit | Window |
|----------|-------|--------|
| Dashboard | 50 | 1 minute |
| Tasks | 100 | 1 minute |
| User | 100 | 1 minute |

## Key Files

```
backend/api-gateway/
├── src/
│   ├── config/
│   │   └── rate-limit.config.ts          # Rate limit configuration
│   ├── guards/
│   │   └── gql-throttler.guard.ts        # Custom GraphQL guard
│   ├── app.module.ts                     # Global guard setup
│   └── modules/
│       ├── auth/auth.resolve.ts          # Auth resolver limits
│       └── ai/ai.resolver.ts             # AI resolver limits
└── tests/
    └── rate-limit.spec.ts                # Rate limiting tests
```

## Custom GraphQL Throttler Guard

`GqlThrottlerGuard` extends the base `ThrottlerGuard` to extract the request/response from the GraphQL execution context and track by:

```
throttle:user:{userId}:{name}:{suffix}   # authenticated
throttle:ip:{ipAddress}:{name}:{suffix}  # anonymous
```

## Usage

### Apply a rate limit to a resolver

```typescript
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../config/rate-limit.config';

@Resolver()
export class MyResolver {
  @Throttle(RateLimits.AI_CHAT)
  @Mutation(() => ChatResponse)
  async chat(@Args('input') input: ChatRequestInput) {
    return this.aiService.chat(input);
  }
}
```

### Skip rate limiting

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Query(() => HealthStatus)
async health() {
  return { status: 'ok' };
}
```

### Add a new rate limit configuration

In `rate-limit.config.ts`:

```typescript
export const RateLimits = {
  // ... existing limits
  CUSTOM_OPERATION: {
    short: { limit: 20, ttl: 60000 }, // 20 requests per minute
  },
};
```

## Response Behavior

When a limit is exceeded, the API returns HTTP `429 Too Many Requests`:

```json
{
  "errors": [
    {
      "message": "ThrottlerException: Too Many Requests",
      "extensions": { "code": "THROTTLED" }
    }
  ]
}
```

## Production Setup

### Redis Storage (recommended for multi-instance deployments)

```bash
pnpm add @nestjs/throttler-storage-redis ioredis
```

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

### Environment-Based Limits

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const rateLimitConfig = {
  throttlers: [
    {
      name: 'short',
      ttl: 1000,
      limit: isDevelopment ? 100 : 10, // more lenient in dev
    },
    // ...
  ],
};
```

## Security Best Practices

1. Monitor for repeated limit violations as an abuse signal
2. Prefer authenticated (user ID) tracking over IP when possible
3. Review and tune limits regularly based on real usage
4. Consider tiered limits per user role/plan
5. Pair with circuit breakers for downstream service protection

## Testing

```bash
cd backend/api-gateway
pnpm test rate-limit.spec.ts

# Build verification
pnpm run build
```

## Related Files

- `backend/api-gateway/src/config/rate-limit.config.ts`
- `backend/api-gateway/src/guards/gql-throttler.guard.ts`
- `backend/api-gateway/src/app.module.ts`
- `backend/api-gateway/src/modules/auth/auth.resolve.ts`
- `backend/api-gateway/src/modules/ai/ai.resolver.ts`
- `backend/api-gateway/tests/rate-limit.spec.ts`

See also [API_GATEWAY_SECURITY.md](./API_GATEWAY_SECURITY.md) for the WAF, DDoS protection, and security monitoring layers that complement rate limiting.
