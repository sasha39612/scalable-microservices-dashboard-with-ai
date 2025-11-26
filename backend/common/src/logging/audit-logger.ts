import { Pool } from 'pg';
import { logger } from './logger';
import { AuditLogEntry, AuditAction, AuditStatus, AuditSeverity } from './audit.types';

export class AuditLogger {
  private pool: Pool | null = null;
  private serviceName: string;
  private fallbackToConsole: boolean;

  constructor(serviceName: string, pool?: Pool, fallbackToConsole = true) {
    this.serviceName = serviceName;
    this.pool = pool || null;
    this.fallbackToConsole = fallbackToConsole;
  }

  /**
   * Set the database pool for audit logging
   */
  setPool(pool: Pool): void {
    this.pool = pool;
  }

  /**
   * Log an audit event
   */
  async log(entry: Partial<AuditLogEntry>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      timestamp: new Date(),
      status: entry.status || AuditStatus.SUCCESS,
      severity: entry.severity || AuditSeverity.LOW,
      serviceName: this.serviceName,
      ...entry,
      action: entry.action!,
    };

    // Log to console for visibility
    logger.info('Audit Log', {
      action: auditEntry.action,
      status: auditEntry.status,
      userId: auditEntry.userId,
      resource: auditEntry.resource,
      severity: auditEntry.severity,
    });

    try {
      if (this.pool) {
        await this.saveToDatabase(auditEntry);
      } else if (this.fallbackToConsole) {
        logger.warn('Audit log pool not configured, logging to console only', auditEntry);
      }
    } catch (error) {
      logger.error('Failed to save audit log', { error, entry: auditEntry });
      // Don't throw - audit logging should never break the application
    }
  }

  /**
   * Log successful action
   */
  async logSuccess(
    action: AuditAction,
    userId: string | undefined,
    options: {
      resource?: string;
      resourceId?: string;
      metadata?: Record<string, unknown>;
      severity?: AuditSeverity;
      userEmail?: string;
      userRole?: string;
      ipAddress?: string;
      userAgent?: string;
      duration?: number;
    } = {}
  ): Promise<void> {
    await this.log({
      action,
      status: AuditStatus.SUCCESS,
      userId,
      severity: options.severity || this.getDefaultSeverity(action),
      ...options,
    });
  }

  /**
   * Log failed action
   */
  async logFailure(
    action: AuditAction,
    userId: string | undefined,
    errorMessage: string,
    options: {
      resource?: string;
      resourceId?: string;
      metadata?: Record<string, unknown>;
      severity?: AuditSeverity;
      userEmail?: string;
      userRole?: string;
      ipAddress?: string;
      userAgent?: string;
      duration?: number;
    } = {}
  ): Promise<void> {
    await this.log({
      action,
      status: AuditStatus.FAILURE,
      userId,
      errorMessage,
      severity: options.severity || AuditSeverity.MEDIUM,
      ...options,
    });
  }

  /**
   * Log error
   */
  async logError(
    action: AuditAction,
    userId: string | undefined,
    error: Error | string,
    options: {
      resource?: string;
      resourceId?: string;
      metadata?: Record<string, unknown>;
      severity?: AuditSeverity;
      userEmail?: string;
      userRole?: string;
      ipAddress?: string;
      userAgent?: string;
      duration?: number;
    } = {}
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    await this.log({
      action,
      status: AuditStatus.ERROR,
      userId,
      errorMessage,
      severity: options.severity || AuditSeverity.HIGH,
      ...options,
    });
  }

  /**
   * Save audit log to database
   */
  private async saveToDatabase(entry: AuditLogEntry): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not configured');
    }

    const query = `
      INSERT INTO audit_logs (
        timestamp, action, status, severity, user_id, user_email, user_role,
        ip_address, user_agent, resource, resource_id, metadata,
        error_message, service_name, duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `;

    const values = [
      entry.timestamp,
      entry.action,
      entry.status,
      entry.severity,
      entry.userId || null,
      entry.userEmail || null,
      entry.userRole || null,
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.resource || null,
      entry.resourceId || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      entry.errorMessage || null,
      entry.serviceName,
      entry.duration || null,
    ];

    await this.pool.query(query, values);
  }

  /**
   * Get default severity for an action
   */
  private getDefaultSeverity(action: AuditAction): AuditSeverity {
    // Critical actions
    if (
      action.includes('delete') ||
      action.includes('role.change') ||
      action.includes('permission.change') ||
      action === AuditAction.USER_CREATE ||
      action === AuditAction.ACCESS_DENIED
    ) {
      return AuditSeverity.HIGH;
    }

    // Medium priority actions
    if (
      action.includes('create') ||
      action.includes('update') ||
      action.includes('password') ||
      action === AuditAction.USER_LOGIN ||
      action === AuditAction.RATE_LIMIT_EXCEEDED
    ) {
      return AuditSeverity.MEDIUM;
    }

    // Low priority actions (reads, views)
    return AuditSeverity.LOW;
  }

  /**
   * Query audit logs (for admin/reporting)
   */
  async query(filters: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    status?: AuditStatus;
    severity?: AuditSeverity;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    if (!this.pool) {
      throw new Error('Database pool not configured');
    }

    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      values.push(filters.userId);
    }

    if (filters.action) {
      conditions.push(`action = $${paramIndex++}`);
      values.push(filters.action);
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.severity) {
      conditions.push(`severity = $${paramIndex++}`);
      values.push(filters.severity);
    }

    if (filters.startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      values.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const query = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows.map(this.mapRowToAuditEntry);
  }

  /**
   * Map database row to AuditLogEntry
   */
  private mapRowToAuditEntry(row: { id: string; timestamp: Date; action: string; status: string; severity: string; user_id: string; user_email: string; user_role: string; [key: string]: unknown }): AuditLogEntry {
    return {
      id: row.id,
      timestamp: row.timestamp,
      action: row.action as AuditAction,
      status: row.status as AuditStatus,
      severity: row.severity as AuditSeverity,
      userId: row.user_id,
      userEmail: row.user_email,
      userRole: row.user_role,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      resource: row.resource as string | undefined,
      resourceId: row.resource_id as string | undefined,
      metadata: row.metadata as Record<string, unknown> | undefined,
      errorMessage: row.error_message as string | undefined,
      serviceName: row.service_name as string,
      duration: row.duration as number | undefined,
    };
  }
}

// Create singleton instances for each service (will be configured with pool later)
export const apiGatewayAuditLogger = new AuditLogger('api-gateway');
export const aiServiceAuditLogger = new AuditLogger('ai-service');
export const workerServiceAuditLogger = new AuditLogger('worker-service');
