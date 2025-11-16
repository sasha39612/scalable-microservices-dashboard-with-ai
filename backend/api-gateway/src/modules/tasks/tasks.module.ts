import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksResolver } from './tasks.resolver';
import { WorkerClient } from '../../services/worker.client';

@Module({
  providers: [TasksService, TasksResolver, WorkerClient],
  exports: [TasksService],
})
export class TasksModule {}
