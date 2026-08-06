# Audit Logging

A centralized audit logging system that tracks sensitive operations across the microservices (API Gateway, AI Service, Worker Service) for security, compliance, and debugging purposes. All services write to a single `audit_logs` PostgreSQL table.

## Key Features

- **Centralized** - all services log to one `audit_logs` table
- **Automatic tracking** - interceptors/middleware capture most operations without manual code
- **Rich context** - user id/email/role, IP address, user agent, and free-form metadata
- **Sanitized** - passwords, tokens, API keys, credit card numbers, SSNs, private keys are automatically redacted before storage
- **Non-blocking** - audit logging failures are caught and logged but never break the application flow
- **Indexed** - queries by user, action, time range, severity, and service are backed by dedicated indexes

## Architecture

### Components

1. **Common package** (`backend/common/src/logging/`)
   - `audit.types.ts` — `AuditAction` enum (25+ actions), `AuditStatus`, `AuditSeverity`, and the `AuditLogEntry` interface
   - `audit-logger.ts` — `AuditLogger` class: `logSuccess` / `logFailure` / `logError` / `query`, backed by a dedicated PostgreSQL connection pool; automatic severity assignment per action
   - `audit-helpers.ts` — context extraction from Express/GraphQL requests (user info, IP, user agent) and sensitive-data sanitization

2. **Database schema** — `backend/api-gateway/migrations/create-audit-logs.sql`

3. **Service integration**
   - **API Gateway**: `AuditInterceptor` auto-audits GraphQL resolvers (20+ mapped); `auth.service.ts` and `user.service.ts` add targeted manual logging; `AuditLoggerInitializer` sets up the connection pool on module init and registers in `app.module.ts`
   - **AI Service**: `AIAuditInterceptor` audits HTTP endpoints (chat, analysis, conversation management) with conditional initialization
   - **Worker Service**: scaffolding in place for background job tracking (job create/cancel/status), not yet fully wired

## Audit Actions

### Authentication & Authorization
`user.login`, `user.logout`, `user.signup`, `token.refresh`, `password.change`, `password.reset`, `access.denied`, `rate_limit.exceeded`

### User Management
`user.create`, `user.update`, `user.delete`, `user.view`, `user.role.change`

### AI Operations
`ai.chat.create`, `ai.chat.view`, `ai.chat.delete`, `ai.analysis.request`, `ai.model.change`

### Tasks & Jobs
`task.create`, `task.update`, `task.delete`, `task.view`, `job.create`, `job.cancel`, `job.view`

### Dashboard & System
`dashboard.view`, `dashboard.export`, `settings.change`, `permission.change`

### Coverage notes
Auth and AI operations are fully wired end-to-end. User management, task/job, and dashboard actions are captured generically by the interceptors; some finer-grained events (user deletion, role changes, dashboard export, settings changes) have the enum/infra in place but are not yet emitted from business logic.

## Severity Levels

| Severity | Examples |
|---|---|
| `low` | Read operations, views |
| `medium` | Create/update operations, authentication |
| `high` | Delete operations, role changes, access denied |
| `critical` | Security events, system-wide changes |

## Schema / Data Model

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,   -- success, failure, error
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical

  -- User information
  user_id UUID,
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- Request information
  ip_address INET,
  user_agent TEXT,

  -- Resource information
  resource VARCHAR(100),
  resource_id VARCHAR(255),

  -- Additional data
  metadata JSONB,
  error_message TEXT,

  -- Service information
  service_name VARCHAR(50) NOT NULL,
  duration INTEGER -- milliseconds
);
```

`user_id` has a foreign key relationship to the `users` table. Table and columns are commented in the migration for self-documentation.

### Indexes

- Single-column: `user_id`, `action`, `timestamp`, `status`, `severity`, `service_name`
- Composite: `(user_id, timestamp)`, `(action, timestamp)`, `(severity, timestamp)`
- Resource lookup: `(resource, resource_id)`
- GIN index on `metadata` (JSONB) for flexible metadata queries

## Configuration & Setup

Requires `DATABASE_URL` to be set for each service.

```bash
# 1. Apply the migration
psql $DATABASE_URL -f backend/api-gateway/migrations/create-audit-logs.sql

# 2. Rebuild the common package, then each service
cd backend/common && pnpm build
cd ../api-gateway && pnpm build
cd ../ai-service && pnpm build
cd ../worker-service && pnpm build

# 3. Run the test script
./scripts/test-audit-logging.sh

# 4. Deploy — services log automatically once the pool is initialized
docker-compose up -d --build
```

## Usage

### Automatic (interceptors — recommended for most cases)

```graphql
mutation {
  login(email: "user@example.com", password: "secret") {
    accessToken
  }
}
# Automatically logs a `user.login` event with status, user info, IP, and timing
```

- API Gateway: GraphQL operations audited via `AuditInterceptor`
- AI Service: HTTP endpoints audited via `AIAuditInterceptor`

### Manual logging

```typescript
import { apiGatewayAuditLogger, AuditAction, AuditSeverity } from 'common';

// Success
await apiGatewayAuditLogger.logSuccess(
  AuditAction.USER_LOGIN,
  userId,
  {
    userEmail: 'user@example.com',
    userRole: 'admin',
    ipAddress: '192.168.1.1',
    resource: 'auth',
    metadata: { loginMethod: 'password' },
  }
);

// Failure
await apiGatewayAuditLogger.logFailure(
  AuditAction.USER_LOGIN,
  userId,
  'Invalid credentials',
  { userEmail: 'user@example.com', ipAddress: '192.168.1.1' }
);

// Error
await apiGatewayAuditLogger.logError(
  AuditAction.USER_UPDATE,
  userId,
  error,
  { userEmail: 'user@example.com', resource: 'user', resourceId: userId }
);
```

### Querying from code

```typescript
import { apiGatewayAuditLogger, AuditAction, AuditSeverity } from 'common';

const logs = await apiGatewayAuditLogger.query({
  userId: 'user-id',
  action: AuditAction.USER_LOGIN,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  severity: AuditSeverity.HIGH,
  limit: 100,
  offset: 0,
});
```

## Querying the Database

```sql
-- Recent activity
SELECT timestamp, action, user_email, status, resource
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 20;

-- Failed logins in the last 24h, grouped by user
SELECT user_email, COUNT(*) AS attempts, MAX(timestamp) AS last_attempt
FROM audit_logs
WHERE action = 'user.login' AND status = 'failure'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_email
ORDER BY attempts DESC;

-- Single user's activity timeline
SELECT timestamp, action, status, resource
FROM audit_logs
WHERE user_id = 'user-uuid'
ORDER BY timestamp DESC
LIMIT 50;

-- High-severity events in the last 24h
SELECT * FROM audit_logs
WHERE severity IN ('high', 'critical')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Action/status breakdown over 7 days
SELECT action, status, COUNT(*) AS count
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY action, status
ORDER BY count DESC;

-- Metadata search (JSONB containment)
SELECT * FROM audit_logs
WHERE metadata @> '{"field": "value"}'::jsonb;
```

## Monitoring & Alerts

```sql
-- Brute-force detection: 5+ failed logins from the same user/IP in 1 hour
SELECT user_email, ip_address, COUNT(*)
FROM audit_logs
WHERE action = 'user.login' AND status = 'failure'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_email, ip_address
HAVING COUNT(*) >= 5;

-- Role changes in the last 24h
SELECT * FROM audit_logs
WHERE action = 'user.role.change'
  AND timestamp > NOW() - INTERVAL '24 hours';

-- Excessive dashboard exports (possible data exfiltration)
SELECT user_email, COUNT(*) AS exports
FROM audit_logs
WHERE action = 'dashboard.export'
  AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY user_email
HAVING COUNT(*) > 10;

-- Rate limit violations
SELECT COUNT(*), user_id
FROM audit_logs
WHERE action = 'rate_limit.exceeded'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_id;
```

Suggested things to alert on: multiple failed logins from the same IP, role changes outside business hours, excessive exports/data access, and any critical-severity system-setting change.

## Testing & Verification

```bash
# Runs the end-to-end check: creates the table, verifies structure/indexes,
# does a test insert, and prints example queries.
./scripts/test-audit-logging.sh
```

Manual verification:

```sql
-- Table structure
\d audit_logs

-- Indexes present
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'audit_logs';

-- Recent logs exist
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;

-- Counts by action
SELECT action, COUNT(*) FROM audit_logs GROUP BY action ORDER BY COUNT(*) DESC;

-- Failed/errored operations
SELECT * FROM audit_logs WHERE status IN ('failure', 'error') ORDER BY timestamp DESC LIMIT 20;
```

Troubleshooting "no logs appearing":

```bash
# 1. Check DB connectivity
psql $DATABASE_URL -c "SELECT 1"

# 2. Check the table exists and has rows
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_logs"

# 3. Check service logs for audit-related errors
docker-compose logs api-gateway | grep -i audit
```

Troubleshooting slow queries:

```sql
-- Index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'audit_logs';

-- Slow query stats (requires pg_stat_statements)
SELECT query, mean_exec_time FROM pg_stat_statements
WHERE query LIKE '%audit_logs%' ORDER BY mean_exec_time DESC;
```

Consider partitioning the table by `timestamp` if volume grows very high.

## Security Considerations

- Sensitive fields (passwords, tokens/API keys, credit card numbers, SSNs, private keys) are redacted by the sanitization helpers before a row is written.
- Only authenticated services write audit logs; audit log **reads** should be restricted to admin users.
- Consider a read-only replica for heavy audit-log analysis so it doesn't compete with production traffic.
- `INET` type enforces valid IP address storage; `JSONB` metadata avoids SQL injection risk from arbitrary structured data.

## Retention & Archival

```sql
-- Delete low-severity logs older than 1 year
DELETE FROM audit_logs
WHERE severity = 'low'
  AND timestamp < NOW() - INTERVAL '1 year';

-- Keep high/critical-severity logs much longer (e.g. compliance)
DELETE FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '7 years'
  AND severity IN ('high', 'critical');

-- Archive before deleting, if required
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '1 year';
```

Periodic maintenance:

```sql
ANALYZE audit_logs;
REINDEX TABLE audit_logs;
```

Export for offline analysis:

```bash
# CSV
psql $DATABASE_URL -c "COPY (SELECT * FROM audit_logs WHERE timestamp > NOW() - INTERVAL '30 days') TO STDOUT WITH CSV HEADER" > audit_logs.csv

# JSON
psql $DATABASE_URL -t -c "SELECT json_agg(row_to_json(audit_logs.*)) FROM audit_logs WHERE timestamp > NOW() - INTERVAL '30 days'" > audit_logs.json
```

## Compliance Mapping

The schema and access patterns are designed to support:

- **GDPR** — user data access tracking, right-to-access records
- **HIPAA** — healthcare data access auditing
- **SOC 2** — security event logging / incident response
- **PCI DSS** — payment system access logs
- **ISO 27001** — information security management

## Performance Notes

- Dedicated connection pool (5 connections) isolates audit writes from application traffic.
- All audit operations are async/non-blocking; a logging failure is caught and logged, never propagated.
- Comprehensive indexing (see Schema section) keeps common filter/query patterns fast.
- For very high write volumes, consider partitioning `audit_logs` by `timestamp` and/or batching inserts.

## File Reference

| Purpose | Path |
|---|---|
| Migration / schema | `backend/api-gateway/migrations/create-audit-logs.sql` |
| Types (actions, status, severity) | `backend/common/src/logging/audit.types.ts` |
| Core logger | `backend/common/src/logging/audit-logger.ts` |
| Context/sanitization helpers | `backend/common/src/logging/audit-helpers.ts` |
| API Gateway interceptor | `backend/api-gateway/src/interceptors/audit.interceptor.ts` |
| API Gateway pool init | `backend/api-gateway/src/services/audit-logger-initializer.ts` |
| AI Service interceptor | `backend/ai-service/src/interceptors/ai-audit.interceptor.ts` |
| AI Service pool init | `backend/ai-service/src/services/audit-logger-initializer.ts` |
| Test script | `scripts/test-audit-logging.sh` |

## Known Gaps / Future Work

- Worker Service job tracking is scaffolded but not fully emitting events
- User deletion and role-change events are defined but not yet triggered from business logic
- Dashboard export and settings-change events likewise defined but not yet emitted
- Real-time audit log streaming (e.g. WebSocket), anomaly detection, SIEM integration (Splunk/ELK), a dedicated visualization dashboard, automated compliance reports, and at-rest encryption of audit records are not implemented
