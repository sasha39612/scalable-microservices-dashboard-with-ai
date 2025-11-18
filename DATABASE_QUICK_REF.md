# Database Integration Quick Reference

## 🚀 Quick Start

### 1. Rebuild and Start Services
```bash
docker compose -f docker-compose.dev.yml up -d --build api-gateway
```

### 2. Verify Database Tables
```bash
ssh dev@138.199.175.38
PGPASSWORD=REDACTED psql -h 138.199.175.38 -U dashboard_user -d microservices_dashboard -c '\dt'
```

Expected tables:
- `users`
- `tasks`
- `jobs`
- `chat_messages`
- `dashboard_insights`

### 3. Test User Creation
```bash
./scripts/test-user-creation.sh
```

## 📊 Database Queries

### Check Users
```sql
SELECT id, email, name, "createdAt" FROM users;
```

### Check Tasks
```sql
SELECT id, type, status, priority, "createdAt" FROM tasks ORDER BY "createdAt" DESC LIMIT 10;
```

### Check Jobs
```sql
SELECT id, name, status, schedule, "lastRun", "nextRun" FROM jobs;
```

### Check Chat History
```sql
SELECT id, role, content, "userId", "conversationId", timestamp 
FROM chat_messages 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Check Dashboard Insights
```sql
SELECT id, type, title, confidence, "createdAt" 
FROM dashboard_insights 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

## 🔧 GraphQL Mutations

### Create User
```graphql
mutation {
  createUser(input: {
    email: "user@example.com"
    name: "John Doe"
    password: "securepass123"
  }) {
    id
    email
    name
    createdAt
  }
}
```

### Create Task
```graphql
mutation {
  createTask(input: {
    type: "data-processing"
    priority: HIGH
    payload: { data: "test" }
  }) {
    id
    type
    status
    priority
    createdAt
  }
}
```

### Create Job
```graphql
mutation {
  createJob(input: {
    name: "daily-cleanup"
    type: "cleanup"
    schedule: "0 0 * * *"
    payload: {}
  }) {
    id
    name
    status
    schedule
    createdAt
  }
}
```

### Send Chat Message
```graphql
mutation {
  chat(input: {
    messages: [{ role: USER, content: "Hello AI!" }]
    userId: "user-uuid-here"
  }) {
    message
    conversationId
  }
}
```

## 🔍 GraphQL Queries

### Get All Users
```graphql
query {
  users {
    id
    email
    name
    createdAt
  }
}
```

### Get Tasks
```graphql
query {
  tasks {
    tasks {
      id
      type
      status
      priority
      createdAt
    }
    total
  }
}
```

### Get Jobs
```graphql
query {
  jobs {
    id
    name
    status
    schedule
    lastRun
    nextRun
  }
}
```

### Get Dashboard Insights
```graphql
query {
  dashboardInsights {
    id
    type
    title
    description
    confidence
    createdAt
  }
}
```

## 📈 Entity Relationships

```
User (1) ----< (Many) ChatMessage
   └─ userId foreign key
```

## 🛠️ Service Methods

### UserService
```typescript
findAll(): Promise<User[]>
findOne(id: string): Promise<User | undefined>
findByEmail(email: string): Promise<User | undefined>
create(input: CreateUserInput): Promise<User>
update(input: UpdateUserInput): Promise<User | undefined>
```

### TasksService
```typescript
createTask(input: CreateTaskInput): Promise<Task>
getTask(taskId: string): Promise<Task>
getTasks(filters?: TaskFiltersInput): Promise<TasksResponse>
createJob(input: CreateJobInput): Promise<Job>
getJobs(): Promise<Job[]>
getJob(jobId: string): Promise<Job>
```

### AIService
```typescript
chat(input: ChatRequestInput): Promise<ChatResponse>
getChatHistory(userId: string, conversationId?: string): Promise<ChatMessage[]>
```

### DashboardService
```typescript
getDashboardStats(): Promise<DashboardStat[]>
getDashboardInsights(): Promise<DashboardInsight[]>
getHistoricalTrends(days?: number): Promise<HistoricalTrends>
```

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check database is accessible
ssh dev@138.199.175.38 "PGPASSWORD=REDACTED psql -h 138.199.175.38 -U dashboard_user -d microservices_dashboard -c 'SELECT 1'"
```

### View API Gateway Logs
```bash
docker logs api-gateway -f
```

### Check TypeORM Sync
Look for logs like:
```
query: CREATE TABLE "users" ...
query: CREATE TABLE "tasks" ...
```

### Database Reset (Development Only)
```sql
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS dashboard_insights CASCADE;
```

Then restart the API Gateway to recreate tables.

## 📝 Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://dashboard_user:REDACTED@138.199.175.38:5432/microservices_dashboard
NODE_ENV=development
PORT=4000
```

### TypeORM Config
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Task, Job, ChatMessage, DashboardInsight],
  synchronize: true, // Auto-sync schema
  logging: true,     // Log all queries
})
```

## ⚠️ Production Checklist

Before deploying to production:
- [ ] Set `synchronize: false`
- [ ] Create proper migrations
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Enable SSL for database connections
- [ ] Set up monitoring and alerts
- [ ] Add database indexes for performance
- [ ] Implement soft deletes for critical data
