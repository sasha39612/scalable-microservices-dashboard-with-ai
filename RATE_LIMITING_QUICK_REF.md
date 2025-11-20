# Rate Limiting Quick Reference

## Current Rate Limits

### Authentication
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 3 | 1 minute |
| Registration | 3 | 5 minutes |
| Refresh Token | 5 | 1 minute |

### AI Operations
| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat | 10 | 1 minute |
| Analysis | 5 | 1 minute |
| Summary | 5 | 1 minute |

### Standard Operations
| Endpoint | Limit | Window |
|----------|-------|--------|
| Dashboard | 50 | 1 minute |
| Tasks | 100 | 1 minute |
| User | 100 | 1 minute |

### Global Defaults
| Tier | Limit | Window |
|------|-------|--------|
| Short | 10 | 1 second |
| Medium | 100 | 1 minute |
| Long | 1000 | 1 hour |

## Key Files

```
backend/api-gateway/
├── src/
│   ├── config/
│   │   └── rate-limit.config.ts          # Configuration
│   ├── guards/
│   │   └── gql-throttler.guard.ts        # Custom guard
│   └── modules/
│       ├── auth/auth.resolve.ts          # Auth limits
│       └── ai/ai.resolver.ts             # AI limits
└── tests/
    └── rate-limit.spec.ts                # Tests
```

## Quick Actions

### Add Rate Limit to Resolver

```typescript
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../config/rate-limit.config';

@Throttle(RateLimits.AI_CHAT)
@Mutation(() => ChatResponse)
async chat() { }
```

### Skip Rate Limiting

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Query(() => MyType)
async publicQuery() { }
```

### Add Custom Limit

In `rate-limit.config.ts`:
```typescript
export const RateLimits = {
  MY_OPERATION: { short: { limit: 15, ttl: 60000 } },
};
```

## Error Response

```json
{
  "errors": [{
    "message": "ThrottlerException: Too Many Requests",
    "extensions": { "code": "THROTTLED" }
  }]
}
```

## Testing

```bash
cd backend/api-gateway
pnpm test rate-limit.spec.ts
```

## Build & Deploy

```bash
# Build
pnpm run build

# Start
pnpm start:dev
```

## Tracking Strategy

- **Authenticated users**: Tracked by user ID
- **Anonymous users**: Tracked by IP address
- **Health checks**: Excluded from limiting

## Production Setup

For multi-instance deployments, use Redis:

```bash
pnpm add @nestjs/throttler-storage-redis ioredis
```

See `RATE_LIMITING_IMPLEMENTATION.md` for full Redis setup.
