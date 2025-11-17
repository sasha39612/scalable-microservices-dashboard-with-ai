import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TasksController } from './controllers/tasks.controller';
import { QueueService } from './services/queue.service';

@Module({
  imports: [],
  controllers: [HealthController, TasksController],
  providers: [QueueService],
  exports: [QueueService],
})
export class WorkerModule {}
