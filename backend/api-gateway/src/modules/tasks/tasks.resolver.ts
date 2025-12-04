import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CacheInvalidate } from '../../decorators/cache.decorators';
import { TasksService } from './tasks.service';
import { Task, Job, TasksResponse, CreateTaskInput, CreateJobInput, TaskFiltersInput } from './tasks.model';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private readonly tasksService: TasksService) {}

  @Mutation(() => Task, { description: 'Create a new task in the Worker Service' })
  @CacheInvalidate({ patterns: ['worker:tasks:*', 'gql:tasks:*'] })
  async createTask(
    @Args('input') input: CreateTaskInput,
  ): Promise<Task> {
    return this.tasksService.createTask(input);
  }

  @Query(() => Task, { description: 'Get a specific task by ID' })
  async task(
    @Args('taskId') taskId: string,
  ): Promise<Task> {
    return this.tasksService.getTask(taskId);
  }

  @Query(() => TasksResponse, { description: 'Get all tasks with optional filtering' })
  async tasks(
    @Args('filters', { nullable: true }) filters?: TaskFiltersInput,
  ): Promise<TasksResponse> {
    return this.tasksService.getTasks(filters);
  }

  @Mutation(() => Boolean, { description: 'Cancel a task' })
  @CacheInvalidate({ 
    keys: ['worker:task:{{0}}'], 
    patterns: ['worker:tasks:*', 'gql:task:*', 'gql:tasks:*'] 
  })
  async cancelTask(
    @Args('taskId') taskId: string,
  ): Promise<boolean> {
    return this.tasksService.cancelTask(taskId);
  }

  @Mutation(() => Task, { description: 'Retry a failed or cancelled task' })
  @CacheInvalidate({ 
    keys: ['worker:task:{{0}}'], 
    patterns: ['worker:tasks:*', 'gql:task:*', 'gql:tasks:*'] 
  })
  async retryTask(
    @Args('taskId') taskId: string,
    @Args('resetAttempts', { nullable: true }) resetAttempts?: boolean,
  ): Promise<Task> {
    return this.tasksService.retryTask(taskId, resetAttempts);
  }

  @Mutation(() => Job, { description: 'Create a new scheduled job' })
  @CacheInvalidate({ patterns: ['worker:jobs:*', 'gql:job:*', 'gql:jobs:*'] })
  async createJob(
    @Args('input') input: CreateJobInput,
  ): Promise<Job> {
    return this.tasksService.createJob(input);
  }

  @Query(() => [Job], { description: 'Get all scheduled jobs' })
  async jobs(): Promise<Job[]> {
    return this.tasksService.getJobs();
  }

  @Query(() => Job, { description: 'Get a specific job by ID' })
  async job(
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.tasksService.getJob(jobId);
  }

  @Mutation(() => Boolean, { description: 'Pause a scheduled job' })
  @CacheInvalidate({ 
    keys: ['worker:job:{{0}}'], 
    patterns: ['worker:jobs:*', 'gql:job:*', 'gql:jobs:*'] 
  })
  async pauseJob(
    @Args('jobId') jobId: string,
  ): Promise<boolean> {
    return this.tasksService.pauseJob(jobId);
  }

  @Mutation(() => Boolean, { description: 'Resume a paused job' })
  @CacheInvalidate({ 
    keys: ['worker:job:{{0}}'], 
    patterns: ['worker:jobs:*', 'gql:job:*', 'gql:jobs:*'] 
  })
  async resumeJob(
    @Args('jobId') jobId: string,
  ): Promise<boolean> {
    return this.tasksService.resumeJob(jobId);
  }

  @Mutation(() => Boolean, { description: 'Delete a job' })
  async deleteJob(
    @Args('jobId') jobId: string,
  ): Promise<boolean> {
    return this.tasksService.deleteJob(jobId);
  }
}
