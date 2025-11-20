# Inter-Service Authentication Implementation

## Overview

This document describes the API key-based authentication system implemented for securing communication between microservices in the Scalable Microservices Dashboard.

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

## Implementation Details

### 1. API Key Guards

Each service has an `ApiKeyGuard` that:
- Validates the `X-API-Key` header in incoming requests
- Compares against the service's configured API key from environment variables
- Returns 401 Unauthorized if key is missing or invalid
- Supports `@Public()` decorator for endpoints that should bypass authentication (e.g., health checks)

**Files:**
- `backend/worker-service/src/guards/api-key.guard.ts`
- `backend/ai-service/src/guards/api-key.guard.ts`

**Guard Registration:**
Both guards are registered globally via `APP_GUARD` in their respective modules:
```typescript
{
  provide: APP_GUARD,
  useClass: ApiKeyGuard,
}
```

### 2. Service Clients

The API Gateway has client classes that automatically include API keys in all requests:

#### WorkerClient
- Location: `backend/api-gateway/src/services/worker.client.ts`
- Reads `WORKER_SERVICE_API_KEY` from environment
- Uses `getHeaders()` helper to include `X-API-Key` in all fetch requests
- Health check endpoint remains public

#### AIClient
- Location: `backend/api-gateway/src/services/ai.client.ts`
- Reads `AI_SERVICE_API_KEY` from environment
- Uses `getHeaders()` helper to include `X-API-Key` in all fetch requests
- Health check endpoint remains public

### 3. Environment Configuration

Required environment variables:

```env
# Worker Service API Key
WORKER_SERVICE_API_KEY=your-secure-worker-service-key-here

# AI Service API Key
AI_SERVICE_API_KEY=your-secure-ai-service-key-here
```

**Important:** Generate strong, unique keys for each service. Use a secure random string generator.

Example generation (using openssl):
```bash
openssl rand -base64 32
```

### 4. Public Endpoints

Both services have health check endpoints that remain public:
- Worker Service: `GET /health`
- AI Service: `GET /health`

These are marked with the `@Public()` decorator to bypass API key validation.

## Security Features

### ✅ Authentication
- All inter-service requests require valid API keys
- API keys are transmitted via HTTP headers (not in URLs)
- Keys are validated before request processing

### ✅ Isolation
- Each service has its own unique API key
- Keys are stored in environment variables (not in code)
- Keys can be rotated independently

### ✅ Error Handling
- Invalid/missing keys return 401 Unauthorized
- Clear error messages for debugging
- Logs authentication failures

## Setup Instructions

### 1. Generate API Keys

Generate two secure random strings:
```bash
# For Worker Service
openssl rand -base64 32

# For AI Service
openssl rand -base64 32
```

### 2. Configure Environment

Add to your `.env` file:
```env
WORKER_SERVICE_API_KEY=<generated-worker-key>
AI_SERVICE_API_KEY=<generated-ai-key>
```

### 3. Update Docker Compose

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

### 4. Restart Services

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

## Testing

Run the inter-service authentication test script:

```bash
./scripts/test-inter-service-auth.sh
```

This script tests:
1. ✅ Worker Service rejects requests without API key
2. ✅ Worker Service rejects requests with invalid API key
3. ✅ Worker Service accepts requests with valid API key
4. ✅ Worker Service health endpoint is public
5. ✅ AI Service rejects requests without API key
6. ✅ AI Service rejects requests with invalid API key
7. ✅ AI Service accepts requests with valid API key
8. ✅ AI Service health endpoint is public

### Manual Testing

**Test without API key (should fail):**
```bash
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{}}'
# Expected: 401 Unauthorized
```

**Test with valid API key (should succeed):**
```bash
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-worker-service-key" \
  -d '{"type":"test","payload":{}}'
# Expected: 200/201 with task data
```

**Test public endpoint (should succeed):**
```bash
curl http://localhost:4001/health
# Expected: 200 with health status
```

## Integration with Existing Security

This inter-service authentication works alongside:

1. **JWT Authentication** - API Gateway validates user JWTs for incoming GraphQL requests
2. **Role-Based Authorization** - Users must have appropriate roles to access certain operations
3. **API Key Authentication** - Services validate API keys for inter-service communication

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

## Troubleshooting

### Issue: 401 Unauthorized from Worker/AI Service

**Possible Causes:**
1. API key not set in environment variables
2. API key mismatch between gateway and service
3. Header not being sent correctly

**Solution:**
1. Check `.env` file has both keys defined
2. Verify services are reading correct environment variables
3. Check logs for API key validation errors

### Issue: Services not starting

**Possible Causes:**
1. Missing environment variables
2. Invalid API key format

**Solution:**
1. Check `WORKER_SERVICE_API_KEY` and `AI_SERVICE_API_KEY` are set
2. Ensure keys don't contain special characters that need escaping

## Best Practices

### ✅ DO:
- Generate long, random API keys (at least 32 bytes)
- Store keys in environment variables
- Use different keys for each service
- Rotate keys periodically
- Log authentication failures
- Keep health endpoints public

### ❌ DON'T:
- Hardcode API keys in source code
- Share API keys between services
- Store keys in version control
- Use predictable or simple keys
- Expose keys in URLs or logs

## Migration Notes

If upgrading from an unprotected setup:

1. Services will start rejecting unauthenticated requests
2. Ensure all clients include `X-API-Key` header
3. Test with the provided script before production deployment
4. Update any external services that call Worker/AI services

## Key Rotation

To rotate API keys:

1. Generate new keys:
   ```bash
   openssl rand -base64 32
   ```

2. Update `.env` with new keys

3. Restart services:
   ```bash
   docker-compose -f docker-compose.dev.yml restart
   ```

4. Verify with test script

## Related Documentation

- [Global Authentication Implementation](../AI_GATEWAY_INTEGRATION_COMPLETE.md)
- [Role-Based Authorization](../DATABASE_INTEGRATION_COMPLETE.md)
- [Health Checks](../HEALTH_CHECKS_COMPLETE.md)
- [Environment Setup](./.env.example)
