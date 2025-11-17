import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TasksController } from './controllers/tasks.controller';

@Module({
  imports: [],
  controllers: [HealthController, TasksController],
  providers: [],
})
export class WorkerModule {}
