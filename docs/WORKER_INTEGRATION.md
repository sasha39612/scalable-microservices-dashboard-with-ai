# Worker Service Integration

Integration between the API Gateway (GraphQL) and the Worker Service (REST) for background task and scheduled job management.

## Quick Reference

### Start Services
```bash
# Using Docker Compose (recommended)
docker-compose -f docker-compose.dev.yml up api-gateway worker-service

# Or individually
cd backend/worker-service && pnpm start:dev  # Port 4001
cd backend/api-gateway && pnpm start:dev      # Port 4000
```

### Test Integration
```bash
./scripts/test-worker-gateway-integration.sh
```

### Endpoints

Worker Service base URL: `http://localhost:4001/api`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List tasks (filter by `status`, `type`, `limit`, `offset`) |
| GET | `/api/tasks/:id` | Get task by ID |
| POST | `/api/tasks/:id/retry` | Retry a failed task (`{"resetAttempts":false}`) |
| POST | `/api/tasks/:id/cancel` | Cancel a pending/processing task |
| GET | `/api/tasks/:id/logs` | Get task logs (`?limit=100`) |
| GET | `/api/tasks/stats/summary` | Task statistics |
| POST | `/api/jobs` | Create a scheduled job |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:id` | Get job by ID |
| POST | `/api/jobs/:id/pause` | Pause a job |
| POST | `/api/jobs/:id/resume` | Resume a paused job |
| DELETE | `/api/jobs/:id` | Delete a job |
| GET | `/health` | Health check (public) |

API Gateway GraphQL endpoint: `http://localhost:4000/graphql`

Queries: `task`, `tasks`, `job`, `jobs`
Mutations: `createTask`, `cancelTask`, `createJob`, `pauseJob`, `resumeJob`, `deleteJob`

### Quick Test Commands
```bash
# Health check
curl http://localhost:4001/health

# Create a task
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{},"priority":5}'

# Get all tasks
curl http://localhost:4001/api/tasks

# Cancel a task
curl -X POST http://localhost:4001/api/tasks/1/cancel
```

```graphql
# Via GraphQL Playground at http://localhost:4000/graphql
mutation {
  createTask(input: { type: "email", payload: {}, priority: NORMAL }) {
    id
    type
    status
  }
}

query {
  tasks {
    tasks { id type status }
    total
  }
}
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js/React)                │
└───────────────────────────┬──────────────────────────────────┘
                            │ GraphQL
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 4000)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TasksModule                                           │  │
│  │  ├─ TasksResolver (GraphQL)                           │  │
│  │  ├─ TasksService (Business Logic + status/priority     │  │
│  │  │                mapping)                             │  │
│  │  └─ WorkerClient (HTTP Client)                        │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP REST
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                 Worker Service (Port 4001)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TasksController (/api/tasks)                          │  │
│  │  ├─ Create, List, Get, Retry, Cancel                  │  │
│  │  └─ Logs, Stats                                       │  │
│  │                                                        │  │
│  │  JobsController (/api/jobs)                           │  │
│  │  ├─ Create, List, Get                                 │  │
│  │  └─ Pause, Resume, Delete                             │  │
│  │                                                        │  │
│  │  QueueService                                          │  │
│  │  └─ Queue management logic                            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

All Worker Service endpoints are exposed under the `/api` prefix (set via `app.setGlobalPrefix('api')` in `backend/worker-service/src/main.ts`), matching what the API Gateway's `WorkerClient` expects.

## Configuration

### Environment Variables

**API Gateway** (`backend/api-gateway`):
```bash
WORKER_SERVICE_URL=http://worker-service:4001
PORT=4000
```

**Worker Service** (`backend/worker-service`):
```bash
PORT=4001
```

### Docker Compose

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

### Task Management

| Operation | API Gateway (GraphQL) | Worker Service (REST) |
|-----------|------------------------|------------------------|
| Create | mutation `createTask` | `POST /api/tasks` |
| List | query `tasks` | `GET /api/tasks?status=...&type=...&limit=...&offset=...` |
| Get by ID | query `task(taskId: String!)` | `GET /api/tasks/:id` |
| Cancel | mutation `cancelTask(taskId: String!)` | `POST /api/tasks/:id/cancel` |
| Retry | — | `POST /api/tasks/:id/retry` |

Example payload translation on create:
```typescript
// API Gateway input
{ type: string, payload: Record<string, unknown>, priority: 'low' | 'normal' | 'high' }

// Worker Service receives
{ type: string, payload: Record<string, unknown>, priority: 1 | 5 | 10 } // numeric
```

### Job Management (Scheduled Tasks)

| Operation | API Gateway (GraphQL) | Worker Service (REST) |
|-----------|------------------------|------------------------|
| Create | mutation `createJob` | `POST /api/jobs` |
| List | query `jobs` | `GET /api/jobs` |
| Get by ID | query `job(jobId: String!)` | `GET /api/jobs/:id` |
| Pause | mutation `pauseJob(jobId: String!)` | `POST /api/jobs/:id/pause` |
| Resume | mutation `resumeJob(jobId: String!)` | `POST /api/jobs/:id/resume` |
| Delete | mutation `deleteJob(jobId: String!)` | `DELETE /api/jobs/:id` |

## Status & Priority Mapping

The API Gateway's `TasksService` translates between GraphQL enum values and Worker Service status strings.

### Task Status
| GraphQL (API Gateway) | Worker Service | Description |
|------------------------|-----------------|-------------|
| `PENDING` | `pending` | Task is queued |
| `IN_PROGRESS` | `processing` | Task is executing |
| `IN_PROGRESS` | `retrying` | Task is being retried |
| `COMPLETED` | `completed` | Task finished successfully |
| `FAILED` | `failed` | Task encountered an error |
| `FAILED` | `cancelled` | Task was cancelled |

### Job Status
| GraphQL (API Gateway) | Worker Service | Description |
|------------------------|-----------------|-------------|
| `ACTIVE` | `active` | Job is running on schedule |
| `PAUSED` | `paused` | Job is temporarily disabled |
| `FAILED` | `failed` | Job encountered an error |

### Priority
| GraphQL (API Gateway) | Worker Service | Numeric Value |
|------------------------|-----------------|-----------------|
| `LOW` | `low` | 1 |
| `NORMAL` | `normal` | 5 |
| `HIGH` | `high` | 10 |
| `CRITICAL` | — | 20 |

## Error Handling

The `WorkerClient` maps HTTP responses to NestJS exceptions:

```typescript
// Service unavailable / network error
throw new HttpException('Worker Service is unavailable', HttpStatus.SERVICE_UNAVAILABLE);

// Not found
if (response.status === 404) {
  throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
}

// Validation error
if (response.status === 400) {
  throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
}
```

## Health Checks

Both services expose a health endpoint for monitoring:

```bash
curl http://localhost:4001/health   # Worker Service
curl http://localhost:4000/health   # API Gateway
```

Worker Service response:
```json
{ "status": "ok", "timestamp": "2025-11-17T10:00:00.000Z" }
```

The API Gateway's health status depends on the Worker Service's health (configured via `depends_on: condition: service_healthy` in docker-compose).

## Implementation Details

### WorkerClient
- Location: `backend/api-gateway/src/services/worker.client.ts`
- HTTP client using native `fetch`
- Comprehensive error handling and logging
- Type-safe interfaces matching Worker Service responses

### TasksService
- Location: `backend/api-gateway/src/modules/tasks/tasks.service.ts`
- Orchestrates calls to `WorkerClient`
- Maps between GraphQL and Worker Service types (status, priority)
- Handles date/type transformations

### TasksResolver
- Location: `backend/api-gateway/src/modules/tasks/tasks.resolver.ts`
- Exposes GraphQL queries (`task`, `tasks`, `job`, `jobs`) and mutations (`createTask`, `cancelTask`, `createJob`, `pauseJob`, `resumeJob`, `deleteJob`)

### Worker Service Controllers
- `backend/worker-service/src/controllers/tasks.controller.ts` — task CRUD, retry, cancel, logs, stats
- `backend/worker-service/src/controllers/jobs.controller.ts` — scheduled job CRUD, pause/resume
- `backend/worker-service/src/services/queue.service.ts` — underlying queue logic

## Debugging

### Enable Detailed Logging

Worker Service (`main.ts`):
```typescript
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

API Gateway's `WorkerClient` already logs all operations:
```typescript
this.logger.log(`Creating task of type: ${taskDto.type}`);
this.logger.error(`Failed to create task: ${error.message}`);
```

### Common Issues

**Connection refused**
- Check if Worker Service is running.
- Verify `WORKER_SERVICE_URL` is correct.
- Check Docker network connectivity.

**404 on endpoints**
- Verify the `/api` global prefix is set on the Worker Service.
- Check endpoint paths match this document.

**"Worker Service is unavailable"**
- Check `WORKER_SERVICE_URL` configuration and that the service is listening on port 4001.

**"Task not found" (404)**
- Verify the task ID exists and was created successfully.

**"Cannot cancel task" (400)**
- Task must be in `pending` or `processing` status; completed/failed tasks cannot be cancelled.

**Status mapping issues**
- Review the mapping tables above and confirm enum values match between services.

**Type mismatches**
- Ensure priority values are correctly mapped (string ↔ number) and date fields are properly serialized.

## Key Files

**Worker Service**
- `backend/worker-service/src/main.ts` — entry point, sets `/api` prefix
- `backend/worker-service/src/worler.module.ts` — module configuration (registers `JobsController`)
- `backend/worker-service/src/controllers/tasks.controller.ts`
- `backend/worker-service/src/controllers/jobs.controller.ts`
- `backend/worker-service/src/services/queue.service.ts`
- `backend/worker-service/TASKS_API.md` — REST API reference

**API Gateway**
- `backend/api-gateway/src/services/worker.client.ts`
- `backend/api-gateway/src/modules/tasks/tasks.service.ts`
- `backend/api-gateway/src/modules/tasks/tasks.resolver.ts`
- `backend/api-gateway/src/modules/tasks/tasks.model.ts`

**Testing**
- `scripts/test-worker-gateway-integration.sh`

## Future Enhancements

- Request retry logic with exponential backoff
- Circuit breaker pattern
- Request/response caching
- Real-time updates via WebSockets
- Distributed tracing (OpenTelemetry)
- Request rate limiting
- SDK for Worker Service client

## Related Documentation

- [Inter-Service Authentication](./INTER_SERVICE_AUTH.md)
- [Worker Service Tasks API](../backend/worker-service/TASKS_API.md)
