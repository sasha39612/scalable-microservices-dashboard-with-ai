# API Gateway ↔ Worker Service Integration

This document describes the integration between the API Gateway and Worker Service.

## Overview

The API Gateway communicates with the Worker Service via HTTP REST API calls to manage background tasks and scheduled jobs. The integration is implemented using the `WorkerClient` service in the API Gateway.

## Architecture

```
┌─────────────────┐          HTTP REST          ┌──────────────────┐
│                 │  ────────────────────────>   │                  │
│  API Gateway    │                              │ Worker Service   │
│  (Port 4000)    │  <────────────────────────   │  (Port 4001)     │
│                 │                              │                  │
└─────────────────┘                              └──────────────────┘
        │                                                 │
        │                                                 │
    GraphQL API                                      REST API
    (Tasks Module)                               (Tasks & Jobs Controllers)
```

## Configuration

### Environment Variables

**API Gateway** (`backend/api-gateway`):
```bash
WORKER_SERVICE_URL=http://worker-service:4001
```

**Worker Service** (`backend/worker-service`):
```bash
PORT=4001
```

### Docker Compose Configuration

The services are configured in `docker-compose.dev.yml`:

```yaml
api-gateway:
  environment:
    - WORKER_SERVICE_URL=http://worker-service:4001
  depends_on:
    worker-service:
      condition: service_healthy

worker-service:
  ports:
    - "4001:4001"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:4001/health"]
```

## Integration Points

### 1. Task Management

#### Create Task
- **API Gateway**: GraphQL mutation `createTask`
- **Worker Service**: `POST /api/tasks`
- **Status Mapping**: GraphQL TaskStatus → Worker JobStatus

```typescript
// API Gateway Input
{
  type: string,
  payload: Record<string, unknown>,
  priority: 'low' | 'normal' | 'high'
}

// Worker Service Receives
{
  type: string,
  payload: Record<string, unknown>,
  priority: 1 | 5 | 10  // Numeric values
}
```

#### Get Tasks
- **API Gateway**: GraphQL query `tasks`
- **Worker Service**: `GET /api/tasks?status=...&type=...&limit=...&offset=...`

#### Get Task by ID
- **API Gateway**: GraphQL query `task(taskId: String!)`
- **Worker Service**: `GET /api/tasks/:id`

#### Cancel Task
- **API Gateway**: GraphQL mutation `cancelTask(taskId: String!)`
- **Worker Service**: `POST /api/tasks/:id/cancel`

### 2. Job Management (Scheduled Tasks)

#### Create Job
- **API Gateway**: GraphQL mutation `createJob`
- **Worker Service**: `POST /api/jobs`

#### Get Jobs
- **API Gateway**: GraphQL query `jobs`
- **Worker Service**: `GET /api/jobs`

#### Get Job by ID
- **API Gateway**: GraphQL query `job(jobId: String!)`
- **Worker Service**: `GET /api/jobs/:id`

#### Pause Job
- **API Gateway**: GraphQL mutation `pauseJob(jobId: String!)`
- **Worker Service**: `POST /api/jobs/:id/pause`

#### Resume Job
- **API Gateway**: GraphQL mutation `resumeJob(jobId: String!)`
- **Worker Service**: `POST /api/jobs/:id/resume`

#### Delete Job
- **API Gateway**: GraphQL mutation `deleteJob(jobId: String!)`
- **Worker Service**: `DELETE /api/jobs/:id`

## Status Mapping

The API Gateway translates between GraphQL enum values and Worker Service status values:

### Task Status

| GraphQL (API Gateway) | Worker Service | Description |
|----------------------|----------------|-------------|
| `PENDING` | `pending` | Task is queued |
| `IN_PROGRESS` | `processing` | Task is executing |
| `IN_PROGRESS` | `retrying` | Task is being retried |
| `COMPLETED` | `completed` | Task finished successfully |
| `FAILED` | `failed` | Task encountered error |
| `FAILED` | `cancelled` | Task was cancelled |

### Job Status

| GraphQL (API Gateway) | Worker Service | Description |
|----------------------|----------------|-------------|
| `ACTIVE` | `active` | Job is running on schedule |
| `PAUSED` | `paused` | Job is temporarily disabled |
| `FAILED` | `failed` | Job encountered error |

### Priority Mapping

| GraphQL (API Gateway) | Worker Service | Numeric Value |
|----------------------|----------------|---------------|
| `LOW` | `low` | 1 |
| `NORMAL` | `normal` | 5 |
| `HIGH` | `high` | 10 |

## Error Handling

The `WorkerClient` handles various error scenarios:

### 1. Service Unavailable
```typescript
catch (error) {
  throw new HttpException(
    'Worker Service is unavailable',
    HttpStatus.SERVICE_UNAVAILABLE
  );
}
```

### 2. Not Found (404)
```typescript
if (response.status === 404) {
  throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
}
```

### 3. Validation Errors (400)
```typescript
if (response.status === 400) {
  throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
}
```

## Testing the Integration

### Manual Testing

1. **Start both services:**
```bash
# Using Docker Compose
docker-compose -f docker-compose.dev.yml up api-gateway worker-service

# Or individually
cd backend/worker-service && pnpm start:dev
cd backend/api-gateway && pnpm start:dev
```

2. **Test Worker Service directly:**
```bash
# Health check
curl http://localhost:4001/health

# Create a task
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{},"priority":5}'
```

3. **Test via API Gateway GraphQL:**
```graphql
mutation {
  createTask(input: {
    type: "email"
    payload: {}
    priority: NORMAL
  }) {
    id
    type
    status
  }
}

query {
  tasks {
    tasks {
      id
      type
      status
    }
    total
  }
}
```

### Automated Testing

Run the integration test script:

```bash
./scripts/test-worker-gateway-integration.sh
```

This script tests:
- ✅ Worker Service health endpoint
- ✅ Task creation, retrieval, and cancellation
- ✅ Job creation and management
- ✅ API Gateway health endpoint
- ✅ GraphQL endpoint accessibility
- ✅ End-to-end task flow through GraphQL

## Implementation Details

### WorkerClient Service

Location: `backend/api-gateway/src/services/worker.client.ts`

Key features:
- HTTP client using native `fetch` API
- Comprehensive error handling
- Logging for debugging
- Type-safe interfaces
- Automatic retry logic (can be added)

### TasksService

Location: `backend/api-gateway/src/modules/tasks/tasks.service.ts`

Responsibilities:
- Orchestrate calls to WorkerClient
- Map between GraphQL types and Worker Service types
- Transform data between different formats
- Handle business logic for task operations

### TasksResolver

Location: `backend/api-gateway/src/modules/tasks/tasks.resolver.ts`

Provides GraphQL interface:
- Queries: `task`, `tasks`, `job`, `jobs`
- Mutations: `createTask`, `cancelTask`, `createJob`, `pauseJob`, `resumeJob`, `deleteJob`

## Health Checks

Both services implement health check endpoints for monitoring:

### Worker Service
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T10:00:00.000Z"
}
```

### API Gateway
```bash
GET /health
```

The API Gateway depends on Worker Service health for its overall health status (configured in docker-compose).

## Debugging

### Enable Detailed Logging

1. **Worker Service:**
```typescript
// In main.ts
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

2. **API Gateway WorkerClient:**
```typescript
// The WorkerClient already logs all operations
this.logger.log(`Creating task of type: ${taskDto.type}`);
this.logger.error(`Failed to create task: ${error.message}`);
```

### Common Issues

1. **Connection Refused**
   - Check if Worker Service is running
   - Verify WORKER_SERVICE_URL is correct
   - Check Docker network connectivity

2. **404 Not Found on Endpoints**
   - Verify API prefix is set: `app.setGlobalPrefix('api')`
   - Check endpoint paths match documentation

3. **Status Mapping Issues**
   - Review status mapping in TasksService
   - Check enum values match between services

4. **Type Mismatches**
   - Ensure priority values are correctly mapped (string → number)
   - Verify date fields are properly serialized

## Future Enhancements

- [ ] Add request retry logic with exponential backoff
- [ ] Implement circuit breaker pattern
- [ ] Add request/response caching
- [ ] Implement real-time updates via WebSockets
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Implement request rate limiting
- [ ] Add authentication/authorization for service-to-service calls
- [ ] Create SDK for Worker Service client

## Related Documentation

- [Worker Service Tasks API](../backend/worker-service/TASKS_API.md)
- [API Gateway GraphQL Schema](../backend/api-gateway/src/schema.gql)
- [Health Checks Documentation](./HEALTH_CHECKS.md)
