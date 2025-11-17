# Tasks Controller API Documentation

## Overview

The Tasks Controller provides REST API endpoints for managing background tasks in the worker service. It supports creating tasks, fetching tasks, retrying failed tasks, cancelling tasks, and viewing task logs.

## Base URL

```
http://localhost:4001/api/tasks
```

**Note:** All endpoints are prefixed with `/api`.

## Endpoints

### 1. Create Task

Create a new background task.

**Endpoint:** `POST /api/tasks`

**Request Body:**
```json
{
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome",
    "body": "Welcome to our platform!"
  },
  "priority": 5
}
```

**Response:**
```json
{
  "id": "1",
  "type": "email",
  "status": "pending",
  "priority": 5,
  "payload": { "to": "user@example.com", "subject": "Welcome", "body": "Welcome to our platform!" },
  "attempts": 0,
  "maxAttempts": 3,
  "createdAt": "2025-11-17T10:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"email","payload":{"to":"user@example.com"},"priority":5}'
```

---

### 2. Get All Tasks

Fetch all tasks with optional filtering and pagination.

**Endpoint:** `GET /api/tasks`

**Query Parameters:**
- `status` (optional): Filter by task status (`pending`, `processing`, `completed`, `failed`, `cancelled`, `retrying`)
- `type` (optional): Filter by task type (e.g., `email`, `cleanup`, `data-sync`)
- `priority` (optional): Filter by priority level (`1` = Low, `5` = Normal, `10` = High, `20` = Critical)
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "tasks": [
    {
      "id": "1",
      "type": "email",
      "status": "completed",
      "priority": 5,
      "payload": { "to": "user@example.com", "subject": "Welcome" },
      "attempts": 1,
      "maxAttempts": 3,
      "createdAt": "2025-11-17T10:00:00.000Z",
      "startedAt": "2025-11-17T10:01:00.000Z",
      "completedAt": "2025-11-17T10:02:00.000Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

**Example:**
```bash
curl http://localhost:4001/api/tasks?status=failed&limit=10
```

---

### 3. Get Task by ID

Fetch a specific task by its ID.

**Endpoint:** `GET /api/tasks/:id`

**Path Parameters:**
- `id`: Task ID (required)

**Response:**
```json
{
  "id": "1",
  "type": "email",
  "status": "completed",
  "priority": 5,
  "payload": { "to": "user@example.com", "subject": "Welcome" },
  "attempts": 1,
  "maxAttempts": 3,
  "createdAt": "2025-11-17T10:00:00.000Z",
  "startedAt": "2025-11-17T10:01:00.000Z",
  "completedAt": "2025-11-17T10:02:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:4001/api/tasks/1
```

---

### 4. Retry Task

Retry a failed or cancelled task.

**Endpoint:** `POST /api/tasks/:id/retry`

**Path Parameters:**
- `id`: Task ID (required)

**Request Body:**
```json
{
  "resetAttempts": false
}
```

**Body Parameters:**
- `resetAttempts` (optional): If `true`, resets the attempt counter to 0 (default: false)

**Response:**
```json
{
  "id": "2",
  "type": "cleanup",
  "status": "pending",
  "priority": 1,
  "payload": { "target": "temp-files" },
  "attempts": 3,
  "maxAttempts": 3,
  "createdAt": "2025-11-17T08:00:00.000Z"
}
```

**Validations:**
- Task must exist (404 if not found)
- Task status must be `failed` or `cancelled` (400 otherwise)

**Example:**
```bash
curl -X POST http://localhost:4001/api/tasks/2/retry \
  -H "Content-Type: application/json" \
  -d '{"resetAttempts": true}'
```

---

### 5. Cancel Task

Cancel a pending or processing task.

**Endpoint:** `POST /api/tasks/:id/cancel`

**Path Parameters:**
- `id`: Task ID (required)

**Response:**
```json
{
  "id": "3",
  "type": "data-sync",
  "status": "cancelled",
  "priority": 10,
  "payload": { "source": "database-a", "target": "database-b" },
  "attempts": 0,
  "maxAttempts": 5,
  "createdAt": "2025-11-17T10:00:00.000Z",
  "completedAt": "2025-11-17T10:05:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:4001/api/tasks/3/cancel
```

---

### 6. Get Task Logs

View logs for a specific task.

**Endpoint:** `GET /api/tasks/:id/logs`

**Path Parameters:**
- `id`: Task ID (required)

**Query Parameters:**
- `limit` (optional): Number of log entries to return (default: 100)
- `offset` (optional): Number of log entries to skip (default: 0)

**Response:**
```json
{
  "taskId": "1",
  "logs": [
    {
      "timestamp": "2025-11-17T10:00:00.000Z",
      "level": "info",
      "message": "Task created with type: email",
      "metadata": { "priority": 5 }
    },
    {
      "timestamp": "2025-11-17T10:01:00.000Z",
      "level": "info",
      "message": "Task processing started",
      "metadata": { "attempt": 1 }
    },
    {
      "timestamp": "2025-11-17T10:02:00.000Z",
      "level": "info",
      "message": "Task completed successfully"
    }
  ],
  "total": 3
}
```

**Example:**
```bash
curl http://localhost:4001/tasks/1/logs?limit=50
```

---

### 5. Get Task Statistics

Get summary statistics for all tasks.

**Endpoint:** `GET /tasks/stats/summary`

**Response:**
```json
{
  "total": 5,
  "byStatus": {
    "pending": 1,
    "processing": 1,
    "completed": 1,
    "failed": 1,
    "cancelled": 1,
    "retrying": 0
  },
  "byPriority": {
    "low": 1,
    "normal": 2,
    "high": 1,
    "critical": 1
  }
}
```

**Example:**
```bash
curl http://localhost:4001/api/tasks/stats/summary
```

---

## Jobs API

The Worker Service also provides endpoints for managing scheduled jobs.

### Base URL

```
http://localhost:4001/api/jobs
```

### Jobs Endpoints

#### 1. Create Job

**Endpoint:** `POST /api/jobs`

**Request Body:**
```json
{
  "name": "Daily Backup",
  "type": "backup",
  "schedule": "0 0 * * *",
  "payload": {
    "target": "database"
  }
}
```

#### 2. Get All Jobs

**Endpoint:** `GET /api/jobs`

#### 3. Get Job by ID

**Endpoint:** `GET /api/jobs/:id`

#### 4. Pause Job

**Endpoint:** `POST /api/jobs/:id/pause`

#### 5. Resume Job

**Endpoint:** `POST /api/jobs/:id/resume`

#### 6. Delete Job

**Endpoint:** `DELETE /api/jobs/:id`

---

## Task Status Values

- `pending`: Task is queued and waiting to be processed
- `processing`: Task is currently being executed
- `completed`: Task finished successfully
- `failed`: Task encountered an error and could not complete
- `cancelled`: Task was manually cancelled
- `retrying`: Task is being retried after a failure

## Priority Levels

- `1` - Low
- `5` - Normal
- `10` - High
- `20` - Critical

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Task with ID xyz not found"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Task with status processing cannot be retried. Only failed or cancelled tasks can be retried."
}
```

---

## Testing the API

### Start the Worker Service

```bash
cd backend/worker-service
pnpm run start:dev
```

The service will start on port 4001 by default.

### Example cURL Commands

```bash
# Create a task
curl -X POST http://localhost:4001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"email","payload":{"to":"user@example.com"},"priority":5}'

# Get all tasks
curl http://localhost:4001/api/tasks

# Get task by ID
curl http://localhost:4001/api/tasks/1

# Retry a failed task
curl -X POST http://localhost:4001/api/tasks/2/retry \
  -H "Content-Type: application/json" \
  -d '{"resetAttempts": true}'

# Cancel a task
curl -X POST http://localhost:4001/api/tasks/3/cancel

# Get task logs
curl http://localhost:4001/api/tasks/1/logs

# Create a scheduled job
curl -X POST http://localhost:4001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"name":"Daily Backup","type":"backup","schedule":"0 0 * * *","payload":{"target":"database"}}'

# Get all jobs
curl http://localhost:4001/api/jobs

# Pause a job
curl -X POST http://localhost:4001/api/jobs/1/pause

# Delete a job
curl -X DELETE http://localhost:4001/api/jobs/1
```

# Get tasks by status
curl http://localhost:4001/tasks?status=failed

# Get a specific task
curl http://localhost:4001/tasks/1

# Retry a failed task
curl -X POST http://localhost:4001/tasks/2/retry \
  -H "Content-Type: application/json" \
  -d '{"resetAttempts": true}'

# Get task logs
curl http://localhost:4001/tasks/1/logs

# Get task statistics
curl http://localhost:4001/tasks/stats/summary
```

---

## Future Enhancements

- [ ] Integration with actual queue service (Bull, BullMQ, etc.)
- [ ] Database persistence for tasks and logs
- [ ] WebSocket support for real-time task updates
- [ ] Task cancellation endpoint
- [ ] Bulk retry operations
- [ ] Advanced filtering and search capabilities
- [ ] Task scheduling and delayed execution
- [ ] Authentication and authorization
