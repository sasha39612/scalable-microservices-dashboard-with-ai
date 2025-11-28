import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';
import { TasksController } from './controllers/tasks.controller';
import { JobsController } from './controllers/jobs.controller';
import { QueueService } from './services/queue.service';
import { AuditLoggerInitializer } from './services/audit-logger-initializer';
import { ApiKeyGuard } from './guards/api-key.guard';
import { WorkerAuditInterceptor } from './interceptors/worker-audit.interceptor';

@Module({
  imports: [],
  controllers: [HealthController, TasksController, JobsController],
  providers: [
    QueueService,
    AuditLoggerInitializer,
    // Apply audit logging globally
    {
      provide: APP_INTERCEPTOR,
      useClass: WorkerAuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
  exports: [QueueService],
})
export class WorkerModule {}
