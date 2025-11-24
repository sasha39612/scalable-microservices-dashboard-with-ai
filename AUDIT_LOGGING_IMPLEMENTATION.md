# Audit Logging Implementation

## Overview

A comprehensive audit logging system has been implemented across all microservices to track sensitive operations and provide a complete audit trail for security and compliance purposes.

## Features

✅ **Centralized Audit Logging** - All services log to a single `audit_logs` table  
✅ **Automatic Tracking** - Interceptors and middleware automatically capture operations  
✅ **Rich Context** - User info, IP address, user agent, and metadata captured  
✅ **Performance Optimized** - Indexed queries and connection pooling  
✅ **Secure** - Sensitive data automatically sanitized before logging  
✅ **Non-Blocking** - Audit failures don't break application flow  

## Architecture

### Components

1. **Common Package** (`backend/common/src/logging/`)
   - `audit.types.ts` - Audit action enums and data types
   - `audit-logger.ts` - Core audit logging class
   - `audit-helpers.ts` - Helper functions for context extraction

2. **Database Schema** (`backend/api-gateway/migrations/create-audit-logs.sql`)
   - Optimized PostgreSQL table with proper indexes
   - Supports queries by user, action, time range, severity

3. **Service Integration**
   - API Gateway: Authentication, authorization, GraphQL operations
   - AI Service: Chat, analysis, conversation management
   - Worker Service: Background job operations

## Audit Actions Tracked

### Authentication & Authorization
- `user.login` - User login attempts (success/failure)
- `user.logout` - User logout
- `user.signup` - New user registration
- `token.refresh` - Token refresh operations
- `password.change` - Password changes
- `password.reset` - Password reset requests
- `access.denied` - Failed authorization attempts
- `rate_limit.exceeded` - Rate limit violations

### User Management
- `user.create` - User creation
- `user.update` - User profile updates
- `user.delete` - User deletion
- `user.view` - User data access
- `user.role.change` - Role/permission changes

### AI Operations
- `ai.chat.create` - New chat messages
- `ai.chat.view` - Chat history access
- `ai.chat.delete` - Chat deletion
- `ai.analysis.request` - Data analysis requests
- `ai.model.change` - AI model configuration changes

### Task & Job Management
- `task.create` - Task creation
- `task.update` - Task updates
- `task.delete` - Task deletion
- `task.view` - Task access
- `job.create` - Background job creation
- `job.cancel` - Job cancellation
- `job.view` - Job status access

### Dashboard & System
- `dashboard.view` - Dashboard access
- `dashboard.export` - Dashboard data export
- `settings.change` - System settings changes
- `permission.change` - Permission modifications

## Severity Levels

- **LOW** - Read operations, views
- **MEDIUM** - Create/update operations, authentication
- **HIGH** - Delete operations, role changes, access denials
- **CRITICAL** - Security events, system-wide changes

## Database Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- success, failure, error
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

### Indexes

- `idx_audit_logs_user_id` - Fast user-based queries
- `idx_audit_logs_action` - Action-based filtering
- `idx_audit_logs_timestamp` - Time-range queries
- `idx_audit_logs_status` - Status filtering
- `idx_audit_logs_severity` - Severity filtering
- `idx_audit_logs_service_name` - Service-based queries
- `idx_audit_logs_metadata` - JSONB metadata queries (GIN index)
- Composite indexes for common query patterns

## Usage

### Automatic Logging (Recommended)

Most operations are automatically logged via interceptors:

**API Gateway** - GraphQL operations automatically audited via `AuditInterceptor`

**AI Service** - HTTP endpoints automatically audited via `AIAuditInterceptor`

**Worker Service** - Background jobs automatically tracked

### Manual Logging

For custom operations, use the audit logger directly:

```typescript
import { apiGatewayAuditLogger, AuditAction } from 'common';

// Log success
await apiGatewayAuditLogger.logSuccess(
  AuditAction.USER_LOGIN,
  userId,
  {
    userEmail: 'user@example.com',
    userRole: 'admin',
    ipAddress: '192.168.1.1',
    resource: 'auth',
    metadata: { loginMethod: 'password' }
  }
);

// Log failure
await apiGatewayAuditLogger.logFailure(
  AuditAction.USER_LOGIN,
  userId,
  'Invalid credentials',
  {
    userEmail: 'user@example.com',
    ipAddress: '192.168.1.1',
    resource: 'auth'
  }
);

// Log error
await apiGatewayAuditLogger.logError(
  AuditAction.USER_UPDATE,
  userId,
  error,
  {
    userEmail: 'user@example.com',
    resource: 'user',
    resourceId: userId
  }
);
```

### Querying Audit Logs

**From Code:**

```typescript
import { apiGatewayAuditLogger } from 'common';

const logs = await apiGatewayAuditLogger.query({
  userId: 'user-id',
  action: AuditAction.USER_LOGIN,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  severity: AuditSeverity.HIGH,
  limit: 100,
  offset: 0
});
```

**From Database:**

```sql
-- Recent high-severity events
SELECT * FROM audit_logs 
WHERE severity IN ('high', 'critical')
ORDER BY timestamp DESC 
LIMIT 20;

-- Failed login attempts
SELECT user_email, COUNT(*) as attempts, MAX(timestamp) as last_attempt
FROM audit_logs 
WHERE action = 'user.login' AND status = 'failure'
GROUP BY user_email
HAVING COUNT(*) > 3
ORDER BY attempts DESC;

-- User activity timeline
SELECT timestamp, action, status, resource
FROM audit_logs
WHERE user_id = 'user-uuid'
ORDER BY timestamp DESC
LIMIT 50;

-- Metadata search
SELECT * FROM audit_logs
WHERE metadata @> '{"field": "value"}'::jsonb;
```

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply audit logs table creation
psql $DATABASE_URL -f backend/api-gateway/migrations/create-audit-logs.sql
```

### 2. Configure Services

Ensure `DATABASE_URL` is set in environment variables:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

### 3. Build and Deploy

```bash
# Rebuild common package
cd backend/common
pnpm build

# Rebuild services
cd ../api-gateway
pnpm build

cd ../ai-service
pnpm build

cd ../worker-service
pnpm build
```

### 4. Test Audit Logging

```bash
# Run comprehensive test script
./scripts/test-audit-logging.sh
```

## Security Considerations

### Data Sanitization

Sensitive fields are automatically redacted:
- Passwords
- Tokens (access, refresh, API keys)
- Credit card numbers
- SSN
- Private keys

### Access Control

- Only authenticated services can write audit logs
- Audit log queries should be restricted to admin users
- Consider implementing read-only replicas for audit log analysis

### Retention Policy

Implement appropriate retention policies:

```sql
-- Delete audit logs older than 1 year
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '1 year'
AND severity = 'low';

-- Keep high-severity logs longer
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '7 years'
AND severity IN ('high', 'critical');
```

### Archival

For compliance, consider archiving old logs:

```sql
-- Archive to separate table or external storage
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '1 year';
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Failed Authentication Rate**
   ```sql
   SELECT COUNT(*) 
   FROM audit_logs 
   WHERE action LIKE '%login%' 
   AND status = 'failure'
   AND timestamp > NOW() - INTERVAL '1 hour';
   ```

2. **High-Severity Events**
   ```sql
   SELECT COUNT(*), action 
   FROM audit_logs 
   WHERE severity IN ('high', 'critical')
   AND timestamp > NOW() - INTERVAL '24 hours'
   GROUP BY action;
   ```

3. **Rate Limit Violations**
   ```sql
   SELECT COUNT(*), user_id 
   FROM audit_logs 
   WHERE action = 'rate_limit.exceeded'
   AND timestamp > NOW() - INTERVAL '1 hour'
   GROUP BY user_id;
   ```

### Alert Examples

- **Suspicious Activity**: Multiple failed logins from same IP
- **Privilege Escalation**: Role changes outside business hours
- **Data Exfiltration**: Excessive dashboard exports or data access
- **System Changes**: Critical setting modifications

## Performance Considerations

- **Connection Pool**: Dedicated pool with 5 connections for audit logs
- **Async Logging**: All audit operations are non-blocking
- **Batch Operations**: Consider batching for high-volume scenarios
- **Index Maintenance**: Run `ANALYZE audit_logs` periodically
- **Partitioning**: For very high volumes, partition by timestamp

## Compliance

This audit logging system supports compliance with:

- **GDPR** - User data access tracking
- **HIPAA** - Healthcare data access auditing
- **SOC 2** - Security event logging
- **PCI DSS** - Payment system access tracking
- **ISO 27001** - Information security management

## Troubleshooting

### Audit Logs Not Appearing

1. Check database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. Verify table exists:
   ```bash
   psql $DATABASE_URL -c "\dt audit_logs"
   ```

3. Check service logs for errors:
   ```bash
   docker-compose logs api-gateway | grep -i audit
   ```

### Performance Issues

1. Analyze slow queries:
   ```sql
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%audit_logs%' 
   ORDER BY total_exec_time DESC;
   ```

2. Check index usage:
   ```sql
   SELECT * FROM pg_stat_user_indexes 
   WHERE relname = 'audit_logs';
   ```

3. Consider partitioning for large tables

## Future Enhancements

- [ ] Real-time audit log streaming
- [ ] Advanced anomaly detection
- [ ] Integration with SIEM systems
- [ ] Audit log visualization dashboard
- [ ] Export to external audit systems
- [ ] Automated compliance reports

## References

- [OWASP Logging Guide](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [PostgreSQL Audit Extension](https://www.postgresql.org/docs/current/pgaudit.html)
- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)

## Support

For questions or issues with audit logging:
1. Check this documentation
2. Review service logs
3. Query audit_logs table for debugging
4. Contact the security team for compliance questions
