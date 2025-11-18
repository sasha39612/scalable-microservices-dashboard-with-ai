import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksResolver } from './tasks.resolver';
import { WorkerClient } from '../../services/worker.client';
import { Task } from './entities/task.entity';
import { Job } from './entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Job])],
  providers: [TasksService, TasksResolver, WorkerClient],
  exports: [TasksService],
})
export class TasksModule {}
