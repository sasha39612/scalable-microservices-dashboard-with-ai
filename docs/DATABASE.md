# Database

The application persists data to PostgreSQL via TypeORM instead of relying on in-memory storage. This document covers schema, connection setup, environment configuration, and how to verify the integration.

For provisioning a fresh remote PostgreSQL server from scratch (installing Postgres, creating the OS-level user/database, configuring remote access and firewall), see [`REMOTE_DB_SETUP.md`](./REMOTE_DB_SETUP.md). This document assumes that server already exists and focuses on how the application connects to and uses it.

## Architecture

- **Database**: PostgreSQL 14
- **ORM**: TypeORM, configured in `backend/api-gateway/src/app.module.ts`
- **Hybrid storage model**:
  - **Users, chat messages, dashboard insights** — database is the primary store.
  - **Tasks** — Worker Service is the source of truth; the database only caches tasks that have UUID ids (for fast reads / historical queries).
  - **Jobs** — not persisted to the database at all. Worker Service manages jobs entirely in memory using integer ids, which don't fit the UUID schema used elsewhere. The `Job` GraphQL type exists for API typing only.

### TypeORM configuration

```typescript
// backend/api-gateway/src/app.module.ts
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Task, Job, ChatMessage, DashboardInsight],
  synchronize: true, // auto-creates/updates tables; disable in production
  logging: process.env.NODE_ENV === 'development',
})
```

`synchronize: true` creates tables automatically on application startup. This is convenient for development but should be replaced with real migrations in production (see [Migrations](#migrations) below).

## Schema

### `users`
Store of user accounts and authentication data.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | string | Unique |
| `name` | string | |
| `passwordHash` | string | |
| `createdAt`, `updatedAt` | timestamp | |

Entity: `backend/api-gateway/src/modules/user/user.entity.ts`

### `tasks`
Cache of task execution records from the Worker Service.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `type` | string | |
| `status` | enum | `pending`, `in-progress`, `completed`, `failed` |
| `priority` | enum | `low`, `normal`, `high` |
| `payload` | JSONB | |
| `result` | JSONB | nullable |
| `error` | string | nullable |
| `createdAt`, `updatedAt` | timestamp | |

Entity: `backend/api-gateway/src/modules/tasks/entities/task.entity.ts`. Only tasks with UUID ids are cached here; the Worker Service remains the source of truth.

### `chat_messages`
AI conversation history.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `conversationId` | string | nullable |
| `role` | enum | `user`, `assistant`, `system` |
| `content` | text | |
| `userId` | UUID | FK to `users`, nullable |
| `timestamp` | timestamp | |

Entity: `backend/api-gateway/src/modules/ai/entities/chat-message.entity.ts`. Relation: `ManyToOne` with `User`.

### `dashboard_insights`
Cached AI-generated insights (treated as stale after 1 hour).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `type` | string | |
| `title` | string | |
| `description` | text | |
| `data` | JSONB | nullable |
| `confidence` | float | nullable |
| `recommendations` | array | |
| `createdAt`, `updatedAt` | timestamp | |

Entity: `backend/api-gateway/src/modules/dashboard/entities/dashboard-insight.entity.ts`

### Not stored in the database: `jobs`

Jobs (scheduled tasks) live entirely in the Worker Service's memory and use integer ids. The GraphQL API exposes job queries/mutations, but they read/write through to the Worker Service directly rather than through the database.

### Entity relationships

```
User (1) ----< (Many) ChatMessage
   └─ userId foreign key
```

## Connection setup

### Environment variables

```env
DATABASE_URL=postgresql://dashboard_user:<your-password>@<db-host>:5432/microservices_dashboard
NODE_ENV=development
PORT=4000
```

Never commit a real password. Local/secret values belong in an untracked `.env` file (see `DATABASE_CREDENTIALS.md`, which is gitignored and not part of this doc).

### Connecting from code

```typescript
import { getDatabaseConnection, createConnection } from '@common/db/connection';

// Singleton
const dbConnection = getDatabaseConnection();
await dbConnection.connect();
const dataSource = dbConnection.getDataSource();

// One-off
const dataSource = await createConnection();

// Direct repository access
const userRepository = dataSource.getRepository(User);
const users = await userRepository.find();
```

### NestJS module wiring

```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const dbConn = getDatabaseConnection();
        const dataSource = await dbConn.connect();
        return dataSource.options;
      },
    }),
  ],
})
export class AppModule {}
```

Each feature module registers its entities with `TypeOrmModule.forFeature()`:

| Module | Entities |
|---|---|
| `UserModule` | `[User]` |
| `TasksModule` | `[Task, Job]` |
| `AIModule` | `[ChatMessage]` |
| `DashboardModule` | `[DashboardInsight]` |

### Connection pooling

Default pool settings: max 20 / min 5 connections, 30s idle timeout. Adjust in `backend/common/src/db/connection.ts` if you see pool exhaustion (check with `SELECT * FROM pg_stat_activity;`).

## Service layer

| Service | Key methods |
|---|---|
| `UserService` | `findAll()`, `findOne()`, `findByEmail()`, `create()`, `update()` |
| `TasksService` | `createTask()`, `getTask()`, `getTasks()`, `createJob()`, `getJobs()`, `getJob()` |
| `AIService` | `chat()`, `getChatHistory(userId, conversationId?)`, `getInsights()`, `analyzeData()`, `getRecommendations()` |
| `DashboardService` | `getDashboardStats()`, `getDashboardInsights()`, `getHistoricalTrends(days?)` |

Notes:
- `DashboardService` serves cached insights if they are less than an hour old, and falls back to cached data if the AI service call fails.
- `TasksService` fetches from the DB cache when available and syncs with the Worker Service for real-time data; jobs are never cached.
- `AIService.getChatHistory` retrieves a user's conversation history, optionally scoped to a `conversationId`.

## GraphQL API

### Queries

```graphql
query { dashboardStats { ... } }
query { dashboardInsights { ... } }
query { dashboardTrends(days: 7) { ... } }

query { users { ... } }
query { user(id: "...") { ... } }

query { tasks(filters: {...}) { ... } }
query { task(taskId: "...") { ... } }

query { jobs { ... } }
query { job(jobId: "...") { ... } }

query { insights(input: {...}) { ... } }
query { chatHistory(userId: "...", conversationId: "...") { ... } }
```

### Mutations

```graphql
mutation { createUser(input: {...}) { ... } }
mutation { updateUser(input: {...}) { ... } }

mutation { createTask(input: {...}) { ... } }
mutation { cancelTask(taskId: "...") }
mutation { retryTask(taskId: "...", resetAttempts: false) { ... } }

mutation { createJob(input: {...}) { ... } }
mutation { pauseJob(jobId: "...") }
mutation { resumeJob(jobId: "...") }
mutation { deleteJob(jobId: "...") }

mutation { chat(input: {...}) { ... } }
mutation { analyzeData(input: {...}) { ... } }
mutation { generateSummary(input: {...}) { ... } }
```

## Migrations

`synchronize: true` is fine for local development but must be disabled in production. To move to migrations:

1. Set `synchronize: false` in `app.module.ts`.
2. Generate a migration: `npm run migration:generate`.
3. Apply it: `npm run migration:run`.

## Verifying / testing the integration

### Run the test script

```bash
./scripts/test-user-creation.sh
```

This creates a user via GraphQL, then confirms it exists in PostgreSQL.

### Unit tests

```bash
cd backend/common
npm test -- tests/db/connection.spec.ts
```

### Live connection check

```bash
npx ts-node --project backend/common/tsconfig.json backend/common/tests/db/test-connection.ts
```

### Inspect tables directly

```bash
ssh dev@<db-host>
psql -h <db-host> -U dashboard_user -d microservices_dashboard
\dt
```

Expected tables: `users`, `tasks`, `chat_messages`, `dashboard_insights` (plus a `jobs` table definition that the application does not actually populate).

Useful queries:

```sql
SELECT id, email, name, "createdAt" FROM users;

SELECT id, type, status, priority, "createdAt" FROM tasks ORDER BY "createdAt" DESC LIMIT 10;

SELECT id, role, content, "userId", "conversationId", timestamp
FROM chat_messages ORDER BY timestamp DESC LIMIT 20;

SELECT id, type, title, confidence, "createdAt"
FROM dashboard_insights ORDER BY "createdAt" DESC LIMIT 10;
```

### Confirm TypeORM sync ran

Look for logs like:

```
query: CREATE TABLE "users" ...
query: CREATE TABLE "tasks" ...
```

### Reset schema (development only)

```sql
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS dashboard_insights CASCADE;
```

Restart the API Gateway afterward to let TypeORM recreate the tables.

## Troubleshooting

- **Can't connect**: verify `DATABASE_URL` in `.env`, confirm the port is reachable (`nc -zv <db-host> 5432`), and check PostgreSQL logs on the server.
- **Tables keep getting created/dropped unexpectedly**: `synchronize` is likely still `true` in an environment where it shouldn't be — switch to migrations.
- **Pool exhausted**: raise `max` connections in `connection.ts`, look for connection leaks, and inspect `pg_stat_activity`.
- **View API Gateway logs**: `docker logs api-gateway -f`.

## Production hardening checklist

- [ ] Set `synchronize: false` and use migrations
- [ ] Set up automated database backups
- [ ] Configure connection pooling limits appropriately
- [ ] Enable SSL/TLS for database connections
- [ ] Restrict `pg_hba.conf` to known IPs
- [ ] Add indexes for frequently queried columns
- [ ] Implement soft deletes for critical data
- [ ] Set up monitoring/alerting on the database
