# Audit Logging Quick Reference

## Setup

```bash
# 1. Run migration
psql $DATABASE_URL -f backend/api-gateway/migrations/create-audit-logs.sql

# 2. Test audit logging
./scripts/test-audit-logging.sh

# 3. Rebuild services
cd backend/common && pnpm build
cd ../api-gateway && pnpm build
```

## Common Queries

### Recent Activity
```sql
SELECT timestamp, action, user_email, status, resource
FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Failed Logins
```sql
SELECT user_email, COUNT(*) as attempts, MAX(timestamp) as last_attempt
FROM audit_logs 
WHERE action = 'user.login' AND status = 'failure'
AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_email
ORDER BY attempts DESC;
```

### User Activity
```sql
SELECT timestamp, action, status, resource
FROM audit_logs
WHERE user_email = 'user@example.com'
ORDER BY timestamp DESC
LIMIT 50;
```

### High-Severity Events
```sql
SELECT * FROM audit_logs 
WHERE severity IN ('high', 'critical')
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

### Action Statistics
```sql
SELECT action, status, COUNT(*) as count
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY action, status
ORDER BY count DESC;
```

## Manual Logging

```typescript
import { apiGatewayAuditLogger, AuditAction } from 'common';

// Success
await apiGatewayAuditLogger.logSuccess(
  AuditAction.USER_LOGIN,
  userId,
  { userEmail, ipAddress, resource: 'auth' }
);

// Failure
await apiGatewayAuditLogger.logFailure(
  AuditAction.USER_LOGIN,
  userId,
  'Invalid credentials',
  { userEmail, ipAddress }
);

// Error
await apiGatewayAuditLogger.logError(
  AuditAction.USER_UPDATE,
  userId,
  error,
  { userEmail, resource: 'user', resourceId: userId }
);
```

## Audit Actions

### Authentication
- `user.login`, `user.logout`, `user.signup`
- `token.refresh`, `password.change`, `password.reset`
- `access.denied`, `rate_limit.exceeded`

### User Management
- `user.create`, `user.update`, `user.delete`, `user.view`
- `user.role.change`

### AI Operations
- `ai.chat.create`, `ai.chat.view`, `ai.chat.delete`
- `ai.analysis.request`, `ai.model.change`

### Tasks & Jobs
- `task.create`, `task.update`, `task.delete`, `task.view`
- `job.create`, `job.cancel`, `job.view`

### Dashboard
- `dashboard.view`, `dashboard.export`

### System
- `settings.change`, `permission.change`

## Severity Levels

- **LOW** - Read operations, views
- **MEDIUM** - Create/update, authentication
- **HIGH** - Delete, role changes, access denied
- **CRITICAL** - Security events, system changes

## Monitoring Alerts

### Multiple Failed Logins (5+ in 1 hour)
```sql
SELECT user_email, ip_address, COUNT(*) 
FROM audit_logs 
WHERE action = 'user.login' AND status = 'failure'
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_email, ip_address
HAVING COUNT(*) >= 5;
```

### Role Changes
```sql
SELECT * FROM audit_logs
WHERE action = 'user.role.change'
AND timestamp > NOW() - INTERVAL '24 hours';
```

### Data Exports
```sql
SELECT user_email, COUNT(*) as exports
FROM audit_logs
WHERE action = 'dashboard.export'
AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY user_email
HAVING COUNT(*) > 10;
```

## Maintenance

### Cleanup Old Logs
```sql
-- Delete low-severity logs older than 1 year
DELETE FROM audit_logs 
WHERE severity = 'low'
AND timestamp < NOW() - INTERVAL '1 year';
```

### Index Maintenance
```sql
-- Analyze table
ANALYZE audit_logs;

-- Reindex
REINDEX TABLE audit_logs;
```

### Export Logs
```bash
# Export to CSV
psql $DATABASE_URL -c "COPY (SELECT * FROM audit_logs WHERE timestamp > NOW() - INTERVAL '30 days') TO STDOUT WITH CSV HEADER" > audit_logs.csv

# Export to JSON
psql $DATABASE_URL -t -c "SELECT json_agg(row_to_json(audit_logs.*)) FROM audit_logs WHERE timestamp > NOW() - INTERVAL '30 days'" > audit_logs.json
```

## Files

- **Schema**: `backend/api-gateway/migrations/create-audit-logs.sql`
- **Types**: `backend/common/src/logging/audit.types.ts`
- **Logger**: `backend/common/src/logging/audit-logger.ts`
- **Helpers**: `backend/common/src/logging/audit-helpers.ts`
- **Interceptor**: `backend/api-gateway/src/interceptors/audit.interceptor.ts`
- **Test**: `scripts/test-audit-logging.sh`
- **Docs**: `AUDIT_LOGGING_IMPLEMENTATION.md`

## Troubleshooting

**No logs appearing?**
```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Check table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_logs"

# Check service logs
docker-compose logs api-gateway | grep -i audit
```

**Slow queries?**
```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'audit_logs';

-- Check slow queries
SELECT query, mean_exec_time FROM pg_stat_statements 
WHERE query LIKE '%audit_logs%' ORDER BY mean_exec_time DESC;
```
