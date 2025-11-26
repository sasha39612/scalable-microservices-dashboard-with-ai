import { Injectable, OnModuleInit } from '@nestjs/common';
// @ts-expect-error - common package may not be available in all services
import { aiServiceAuditLogger } from 'common';
import { Pool } from 'pg';

@Injectable()
export class AuditLoggerInitializer implements OnModuleInit {
  private pool: Pool | undefined;

  async onModuleInit() {
    // Only initialize if common package is available and DATABASE_URL is set
    if (typeof aiServiceAuditLogger !== 'undefined' && process.env.DATABASE_URL) {
      try {
        // Initialize PostgreSQL pool for audit logging
        this.pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 5,
        });

        // Set the pool for the audit logger
        aiServiceAuditLogger.setPool(this.pool);

        // Test connection
        await this.pool.query('SELECT 1');
        // AI Service audit logger initialized
      } catch {
        // Failed to initialize audit logger
      }
    } else {
      // Audit logging not configured for AI Service
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
