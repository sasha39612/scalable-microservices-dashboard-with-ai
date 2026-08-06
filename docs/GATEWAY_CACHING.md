# Gateway Response Caching

Response caching for the API Gateway to reduce load on microservices and improve response times for frequently requested data. Uses Redis as the primary cache with automatic fallback to in-memory caching.

## Architecture

### Core Components

1. **CacheService** (`src/services/cache.service.ts`)
   - Redis-based caching with memory fallback
   - Automatic TTL management
   - Connection health monitoring
   - Graceful error handling

2. **Cache Interceptors**
   - `GraphQLCacheInterceptor` — caches GraphQL query responses
   - `CacheInterceptor` — general method-level caching
   - Automatic cache key generation
   - User context-aware caching

3. **Cache Decorators** (`src/decorators/cache.decorators.ts`)
   - `@Cacheable` — mark methods for caching
   - `@CacheInvalidate` — invalidate cache on mutations
   - `@CacheKey` — custom cache key generation
   - `@CacheTTL` — specify TTL values

4. **Management APIs**
   - Health monitoring at `/health/detailed`
   - Cache management at `/cache/*` (admin only)
   - Statistics and monitoring endpoints

## Configuration

### Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379          # Redis connection URL
REDIS_HOST=localhost                       # Alternative: host only
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Cache settings
CACHE_DEFAULT_TTL=300                     # Default TTL in seconds
CACHE_ENABLE_FALLBACK=true                # Enable memory fallback
```

### Default TTLs

Configured in `CacheService`:

| TTL constant | Value | Used for |
|---|---|---|
| `DEFAULT_TTL` | 300s (5 min) | General queries |
| `QUERY_CACHE_TTL` | 180s (3 min) | GraphQL queries |
| `USER_CACHE_TTL` | 600s (10 min) | User data |
| `TASK_CACHE_TTL` | 60s (1 min) | Task data |
| `AI_CACHE_TTL` | 900s (15 min) | AI responses |

### Environment-Specific Example

```yaml
# Development
REDIS_URL: redis://localhost:6379
CACHE_DEFAULT_TTL: 60

# Staging
REDIS_URL: redis://staging-redis:6379
CACHE_DEFAULT_TTL: 180

# Production
REDIS_URL: rediss://prod-redis-cluster:6380
CACHE_DEFAULT_TTL: 300
```

## Usage

### Method-Level Caching

```typescript
@Injectable()
export class UserService {
  constructor(private cacheService: CacheService) {}

  // Cache user data for 10 minutes
  @Cacheable({ key: 'user:{{id}}', ttl: 600 })
  async findById(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }

  // Dynamic cache key generation
  @Cacheable({
    key: (userId, includeProfile) => `user:${userId}:${includeProfile ? 'full' : 'basic'}`,
    ttl: 300,
  })
  async getUser(userId: string, includeProfile: boolean): Promise<User> {
    // Implementation
  }

  // Cache invalidation on update
  @CacheInvalidate({
    keys: ['user:{{id}}'],
    patterns: ['user:{{id}}:*', 'users:*'],
  })
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    // Implementation
  }
}
```

### GraphQL Caching

GraphQL queries are cached automatically based on query signature, variables, user context, and operation type (only queries are cached; mutations invalidate related entries).

```graphql
# Cached automatically
query GetUser($id: String!) {
  user(id: $id) {
    id
    name
    email
  }
}

# Invalidates related cache entries
mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    id
    name
    email
  }
}
```

### Client Service Caching

`WorkerClient` and `AIClient` include built-in caching:

```typescript
// Task data cached for 1 minute
const task = await workerClient.getTask(taskId);

// AI insights cached for 15 minutes
const insights = await aiClient.getInsights(request);

// Cache invalidation on mutations
await workerClient.createTask(taskData); // invalidates task lists
```

## Cache Keys

### Patterns

- `user:{id}` — individual user data
- `user:{id}:*` — user-related data
- `worker:task:{id}` — individual task data
- `worker:tasks:*` — task list queries
- `ai:insights:{type}:*` — AI insights by type
- `gql:{queryName}:{hash}` — GraphQL queries

### Generation Strategies

1. **Template-based**: `{{paramName}}` placeholders
2. **Function-based**: dynamic key generation functions
3. **Automatic**: hash-based keys for complex objects

## Monitoring & Management

### Health Checks

```
GET /health              # Basic health check
GET /health/detailed     # Detailed health, including cache status
GET /cache/health        # Cache-specific health
```

### Cache Management (Admin Only)

```
GET    /cache/stats               # Cache statistics
GET    /cache/entry/{key}         # Get a specific entry
POST   /cache/entry               # Set an entry
DELETE /cache/entry/{key}         # Delete an entry
DELETE /cache/pattern             # Delete by pattern
DELETE /cache/all                 # Clear all cache
POST   /cache/warmup              # Warm up cache
```

```bash
# Set a cache entry
curl -X POST http://localhost:4000/cache/entry \
  -d '{"key": "test:key", "value": {"data": "value"}, "ttl": 300}'

# Delete by pattern
curl -X DELETE http://localhost:4000/cache/pattern \
  -d '{"pattern": "user:*"}'
```

### Stats Shape

```typescript
interface CacheStats {
  redisConnected: boolean;
  memoryCacheSize: number;
  memoryCacheKeys: string[];
}
```

## Performance Impact

Expected gains from caching:

| Area | Improvement |
|---|---|
| GraphQL queries (cached) | 50-90% faster |
| Microservice calls | 70-95% latency reduction |
| Complex AI operations | 80-98% faster |
| Database queries | 60-80% fewer |
| External API calls | 70-90% fewer |
| CPU utilization | 20-40% improvement |

Expected cache hit rates by data type:

| Data type | Hit rate |
|---|---|
| User data | 70-85% |
| Task status | 60-75% |
| AI insights | 80-95% |
| Dashboard data | 65-80% |
| System configuration | 90-99% |

## Troubleshooting

**Redis connection failed**
- Check `REDIS_URL`, verify the Redis server is running
- System falls back to in-memory cache automatically

**Cache inconsistency**
- Check cache invalidation patterns and mutation decorators
- Use the cache management API to clear affected keys

**High memory usage**
- Monitor memory cache size, adjust TTL values, clear unnecessary patterns

### Debug Commands

```bash
redis-cli ping                     # Check connectivity
redis-cli monitor                  # Watch cache operations live
redis-cli info memory              # Check memory usage
redis-cli keys "api-gateway:*"     # List all gateway cache keys
```

## Security Considerations

1. **Access control**: cache management endpoints require Admin role; user context is included in cache keys; no sensitive data is stored in cache keys.
2. **Data protection**: Redis password authentication, TLS in production, automatic expiry of stale data.
3. **Cache poisoning prevention**: input validation on cache keys, restricted pattern matching, rate limiting on cache operations.

## Production Checklist

- Redis cluster configured with persistence
- Redis password and TLS enabled
- Cache TTLs tuned for the actual workload
- Monitoring alerts configured
- Backup strategy for critical cache data

## Possible Future Enhancements

- Cache warming strategies, distributed invalidation, compression, multi-layer caching
- Cache hit-rate metrics, performance analytics, automated alerting, size optimization
- Intelligent prefetching, adaptive TTL based on access patterns, cache partitioning
