/* eslint-disable no-console */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { workerServiceAuditLogger } from 'common';

@Injectable()
export class AuditLoggerInitializer implements OnModuleInit {
  private pool: Pool | undefined;

  async onModuleInit(): Promise<void> {
    if (typeof workerServiceAuditLogger !== 'undefined' && process.env.DATABASE_URL) {
      try {
        // Initialize PostgreSQL pool for audit logging
        this.pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 5, // Smaller pool for audit logging
          idleTimeoutMillis: 30000,
        });

        // Set the pool for the audit logger
        workerServiceAuditLogger.setPool(this.pool);

        // Test connection
        await this.pool.query('SELECT 1');
        console.log('✅ Worker Service audit logger initialized');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`❌ Failed to initialize audit logger: ${message}`);
      }
    } else {
      console.log('❌ Audit logging not configured for Worker Service');
    }
  }
}
