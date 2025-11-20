import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health.controller';
import { TasksController } from './controllers/tasks.controller';
import { JobsController } from './controllers/jobs.controller';
import { QueueService } from './services/queue.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [],
  controllers: [HealthController, TasksController, JobsController],
  providers: [
    QueueService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
  exports: [QueueService],
})
export class WorkerModule {}
