# Inter-Service Authentication

## Overview

API key-based authentication secures communication between microservices in the Scalable Microservices Dashboard: the API Gateway authenticates itself to the Worker Service and AI Service using a shared secret sent via the `X-API-Key` header.

## Architecture

### Services Protected
- **Worker Service** (port 4001) - Background job processing
- **AI Service** (port 5000) - AI/ML operations

### Communication Flow
```
API Gateway (authenticated users)
    ↓ [includes X-API-Key header]
Worker Service / AI Service (validates API key)
```

### Security Layers

```
User Request
    ↓
[JWT Authentication] - API Gateway validates user identity
    ↓
[RBAC] - API Gateway validates user permissions
    ↓
[API Key Authentication] - Services validate caller identity
    ↓
Service Processing
```

## Implementation Details

### 1. API Key Guards

Each service has an `ApiKeyGuard` that:
- Validates the `X-API-Key` header on incoming requests
- Compares it against the service's configured API key from environment variables
- Returns 401 Unauthorized if the key is missing or invalid
- Supports a `@Public()` decorator for endpoints that should bypass authentication (e.g., health checks)

**Files:**
- `backend/worker-service/src/guards/api-key.guard.ts` — validates against `WORKER_SERVICE_API_KEY`
- `backend/ai-service/src/guards/api-key.guard.ts` — validates against `AI_SERVICE_API_KEY`
- `backend/worker-service/src/decorators/public.decorator.ts`
- `backend/ai-service/src/decorators/public.decorator.ts`

**Guard Registration:**
Both guards are registered globally via `APP_GUARD` in their respective modules (`worker.module.ts`, `ai.module.ts`):
```typescript
{
  provide: APP_GUARD,
  useClass: ApiKeyGuard,
}
```

### 2. Service Clients (API Gateway)

The API Gateway has client classes that automatically include the API key in every outgoing request via a shared `getHeaders()` helper. Health check calls remain unauthenticated.

#### WorkerClient
- Location: `backend/api-gateway/src/services/worker.client.ts`
- Reads `WORKER_SERVICE_API_KEY` from environment
- `getHeaders()` adds `X-API-Key` to all fetch calls
- Updated endpoints (12): `createTask`, `getTask`, `getTasks`, `updateTask`, `cancelTask`, `retryTask`, `createJob`, `getJobs`, `getJob`, `pauseJob`, `resumeJob`, `deleteJob`
- Health check remains public (no API key)

#### AIClient
- Location: `backend/api-gateway/src/services/ai.client.ts`
- Reads `AI_SERVICE_API_KEY` from environment
- `getHeaders()` adds `X-API-Key` to all fetch calls
- Updated endpoints (9): `chat`, `getInsights`, `analyzeData`, `getRecommendations`, `generateSummary`, `predictTrends`, `detectAnomalies`, `getConversationHistory`
- Health check remains public (no API key)

### 3. Public Endpoints

Both services have health check endpoints that remain public:
- Worker Service: `GET /health`
- AI Service: `GET /health`

These are marked with the `@Public()` decorator to bypass API key validation.

## Environment Configuration

Required environment variables (`.env.example`):

```env
# Inter-service authentication: Generate a secure random key
WORKER_SERVICE_API_KEY=worker-secret-key-change-in-production
AI_SERVICE_API_KEY=ai-secret-key-change-in-production
```

Generate secure keys with:
```bash
openssl rand -base64 32
```

**Important:** Use a unique, strong key per service. Never reuse the AI Service key for the Worker Service or vice versa.

### Docker Compose

Ensure environment variables are passed to services in `docker-compose.dev.yml`:

```yaml
api-gateway:
  environment:
    - WORKER_SERVICE_API_KEY=${WORKER_SERVICE_API_KEY}
    - AI_SERVICE_API_KEY=${AI_SERVICE_API_KEY}

worker-service:
  environment:
    - WORKER_SERVICE_API_KEY=${WORKER_SERVICE_API_KEY}

ai-service:
  environment:
    - AI_SERVICE_API_KEY=${AI_SERVICE_API_KEY}
```

## Setup Instructions

1. **Generate API keys:**
   ```bash
   openssl rand -base64 32  # For Worker Service
   openssl rand -base64 32  # For AI Service
   ```

2. **Update `.env`:**
   ```env
   WORKER_SERVICE_API_KEY=<generated-key-1>
   AI_SERVICE_API_KEY=<generated-key-2>
   ```

3. **Restart services:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Test:**
   ```bash
   ./scripts/test-inter-service-auth.sh
   ```

## Testing

The automated test script (`scripts/test-inter-service-auth.sh`) checks:
1. Worker Service rejects requests without API key (401)
2. Worker Service rejects invalid API key (401)
3. Worker Service accepts valid API key (200/201)
4. Worker Service health endpoint is public (200)
5. AI Service rejects requests without API key (401)
6. AI Service rejects invalid API key (401)
7. AI Service accepts valid API key (200)
8. AI Service health endpoint is public (200)

### Manual Testing

**Without API key (should fail):**
```bash
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{}}'
# Expected: 401 Unauthorized
```

**With valid API key (should succeed):**
```bash
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-worker-service-key" \
  -d '{"type":"test","payload":{}}'
# Expected: 200/201 with task data
```

**Public endpoint (should succeed without a key):**
```bash
curl http://localhost:4001/health
# Expected: 200 with health status
```

## Troubleshooting

### 401 Unauthorized from Worker/AI Service
**Possible causes:** API key not set, key mismatch between gateway and service, header not sent correctly.
**Fix:** Check `.env` has both keys defined, verify services read the correct environment variables, check logs for validation errors.

### Services not starting
**Possible causes:** Missing environment variables, invalid API key format.
**Fix:** Ensure `WORKER_SERVICE_API_KEY` and `AI_SERVICE_API_KEY` are set and free of characters that need shell escaping.

## Best Practices

### DO
- Generate long, random API keys (at least 32 bytes)
- Store keys in environment variables
- Use a different key per service
- Rotate keys periodically
- Log authentication failures
- Keep health endpoints public

### DON'T
- Hardcode API keys in source code
- Share API keys between services
- Commit keys to version control
- Use predictable or simple keys
- Expose keys in URLs or logs

## Key Rotation

1. Generate new keys:
   ```bash
   openssl rand -base64 32
   ```
2. Update `.env` with the new keys.
3. Restart services:
   ```bash
   docker-compose -f docker-compose.dev.yml restart
   ```
4. Verify with the test script.

## Migration Notes

If upgrading from an unprotected setup:
1. Services will start rejecting unauthenticated requests.
2. Ensure all clients include the `X-API-Key` header.
3. Test with the provided script before production deployment.
4. Update any external services that call the Worker/AI services.

## Production Hardening (Future Enhancements)

- **Mutual TLS (mTLS)** - Replace API keys with certificate-based authentication
- **Service Mesh** - Consider Istio/Linkerd for advanced service-to-service security
- **Automated Key Rotation** - Scheduled rotation instead of manual
- **Monitoring** - Alerts for authentication failures
- **Rate Limiting** - Per-service rate limits
- **Request Signing** - HMAC signatures on requests
- **Payload Encryption** - Encrypt sensitive payloads
- **Audit Logging** - Log all inter-service calls
- **Circuit Breakers** - Resilience patterns for service-to-service calls

## Related Documentation

- [Worker Integration](./WORKER_INTEGRATION.md)
- [Environment Setup](../.env.example)
