# Worker Service - API Gateway Integration Quick Reference

## 🚀 Quick Start

### Start Services
```bash
# Using Docker Compose (Recommended)
docker-compose -f docker-compose.dev.yml up api-gateway worker-service

# Or start individually
cd backend/worker-service && pnpm start:dev  # Port 4001
cd backend/api-gateway && pnpm start:dev      # Port 4000
```

### Test Integration
```bash
./scripts/test-worker-gateway-integration.sh
```

## 📋 API Endpoints

### Worker Service (Direct Access)

**Base URL:** `http://localhost:4001/api`

#### Tasks
```bash
# Create task
POST /api/tasks
Body: {"type":"email","payload":{},"priority":5}

# Get all tasks
GET /api/tasks?status=pending&limit=10

# Get task by ID
GET /api/tasks/{id}

# Retry task
POST /api/tasks/{id}/retry
Body: {"resetAttempts":false}

# Cancel task
POST /api/tasks/{id}/cancel

# Get task logs
GET /api/tasks/{id}/logs?limit=100

# Get stats
GET /api/tasks/stats/summary
```

#### Jobs
```bash
# Create job
POST /api/jobs
Body: {"name":"Daily Backup","type":"backup","schedule":"0 0 * * *","payload":{}}

# Get all jobs
GET /api/jobs

# Get job by ID
GET /api/jobs/{id}

# Pause job
POST /api/jobs/{id}/pause

# Resume job
POST /api/jobs/{id}/resume

# Delete job
DELETE /api/jobs/{id}
```

### API Gateway (GraphQL)

**Endpoint:** `http://localhost:4000/graphql`

#### GraphQL Queries
```graphql
# Get all tasks
query {
  tasks {
    tasks {
      id
      type
      status
      createdAt
    }
    total
  }
}

# Get specific task
query {
  task(taskId: "1") {
    id
    type
    status
    payload
    error
  }
}

# Get all jobs
query {
  jobs {
    id
    name
    schedule
    status
    nextRun
  }
}

# Get specific job
query {
  job(jobId: "1") {
    id
    name
    schedule
    status
    lastRun
    nextRun
  }
}
```

#### GraphQL Mutations
```graphql
# Create task
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

# Cancel task
mutation {
  cancelTask(taskId: "1")
}

# Create job
mutation {
  createJob(input: {
    name: "Daily Backup"
    type: "backup"
    schedule: "0 0 * * *"
    payload: {}
  }) {
    id
    name
    status
  }
}

# Pause job
mutation {
  pauseJob(jobId: "1")
}

# Resume job
mutation {
  resumeJob(jobId: "1")
}

# Delete job
mutation {
  deleteJob(jobId: "1")
}
```

## 🔄 Status Values

### Task Status
- `pending` - Queued and waiting
- `processing` - Currently executing
- `completed` - Finished successfully
- `failed` - Error occurred
- `cancelled` - Manually cancelled
- `retrying` - Being retried

### Job Status
- `active` - Running on schedule
- `paused` - Temporarily disabled
- `failed` - Error in execution

### Priority Levels
- `1` or `LOW` - Low priority
- `5` or `NORMAL` - Normal priority
- `10` or `HIGH` - High priority
- `20` or `CRITICAL` - Critical priority

## 🔧 Configuration

### Environment Variables

**API Gateway** (`.env` or `docker-compose.dev.yml`):
```bash
WORKER_SERVICE_URL=http://worker-service:4001
PORT=4000
```

**Worker Service** (`.env` or `docker-compose.dev.yml`):
```bash
PORT=4001
```

## 📊 Health Checks

```bash
# Worker Service health
curl http://localhost:4001/health

# API Gateway health
curl http://localhost:4000/health
```

## 🧪 Testing

### Manual cURL Tests
```bash
# Create a task
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"test-email","payload":{"to":"user@example.com"},"priority":5}'

# Get all tasks
curl http://localhost:4001/api/tasks

# Cancel a task
curl -X POST http://localhost:4001/api/tasks/1/cancel
```

### GraphQL Tests
1. Open http://localhost:4000/graphql in browser
2. Use GraphQL Playground/Apollo Studio
3. Run queries/mutations from examples above

### Automated Tests
```bash
# Run integration test suite
./scripts/test-worker-gateway-integration.sh

# Expected output: All tests passing ✅
```

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check if services are running
docker-compose ps

# Check Worker Service logs
docker-compose logs worker-service

# Check API Gateway logs
docker-compose logs api-gateway

# Restart services
docker-compose restart api-gateway worker-service
```

### Common Errors

**"Worker Service is unavailable"**
- Check WORKER_SERVICE_URL configuration
- Verify Worker Service is running on port 4001
- Check Docker network connectivity

**"Task not found" (404)**
- Verify task ID exists
- Check task was created successfully

**"Cannot cancel task" (400)**
- Task must be in `pending` or `processing` status
- Completed/failed tasks cannot be cancelled

## 📁 Key Files

### Worker Service
- `backend/worker-service/src/main.ts` - Entry point with API prefix
- `backend/worker-service/src/worler.module.ts` - Module configuration
- `backend/worker-service/src/controllers/tasks.controller.ts` - Task endpoints
- `backend/worker-service/src/controllers/jobs.controller.ts` - Job endpoints
- `backend/worker-service/src/services/queue.service.ts` - Queue logic

### API Gateway
- `backend/api-gateway/src/services/worker.client.ts` - HTTP client for Worker Service
- `backend/api-gateway/src/modules/tasks/tasks.service.ts` - Business logic & mapping
- `backend/api-gateway/src/modules/tasks/tasks.resolver.ts` - GraphQL resolvers
- `backend/api-gateway/src/modules/tasks/tasks.model.ts` - GraphQL types

### Documentation
- `docs/WORKER_GATEWAY_INTEGRATION.md` - Full integration guide
- `backend/worker-service/TASKS_API.md` - REST API documentation
- `scripts/test-worker-gateway-integration.sh` - Integration tests

## 📚 Additional Resources

- [Full Integration Documentation](../docs/WORKER_GATEWAY_INTEGRATION.md)
- [Tasks API Documentation](../backend/worker-service/TASKS_API.md)
- [Health Checks Guide](../docs/HEALTH_CHECKS.md)

---

**Status:** ✅ Integration Complete and Production Ready
