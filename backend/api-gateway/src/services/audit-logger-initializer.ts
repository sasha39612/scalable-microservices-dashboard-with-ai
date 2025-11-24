import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { apiGatewayAuditLogger } from 'common';

@Injectable()
export class AuditLoggerInitializer implements OnModuleInit {
  private pool: Pool;

  constructor() {
    // Initialize PostgreSQL pool for audit logging
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5, // Smaller pool for audit logging
    });
  }

  async onModuleInit() {
    // Set the pool for the audit logger
    apiGatewayAuditLogger.setPool(this.pool);
    
    // Test connection
    try {
      await this.pool.query('SELECT 1');
      console.log('Audit logger database connection established');
    } catch (error) {
      console.error('Failed to initialize audit logger database connection:', error);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
