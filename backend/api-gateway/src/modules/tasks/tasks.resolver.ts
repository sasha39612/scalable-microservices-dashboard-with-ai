import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TasksService } from './tasks.service';
import { Task, Job, TasksResponse, CreateTaskInput, CreateJobInput, TaskFiltersInput } from './tasks.model';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private readonly tasksService: TasksService) {}

  @Mutation(() => Task, { description: 'Create a new task in the Worker Service' })
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
  async cancelTask(
    @Args('taskId') taskId: string,
  ): Promise<boolean> {
    return this.tasksService.cancelTask(taskId);
  }

  @Mutation(() => Task, { description: 'Retry a failed or cancelled task' })
  async retryTask(
    @Args('taskId') taskId: string,
    @Args('resetAttempts', { nullable: true }) resetAttempts?: boolean,
  ): Promise<Task> {
    return this.tasksService.retryTask(taskId, resetAttempts);
  }

  @Mutation(() => Job, { description: 'Create a new scheduled job' })
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
  async pauseJob(
    @Args('jobId') jobId: string,
  ): Promise<boolean> {
    return this.tasksService.pauseJob(jobId);
  }

  @Mutation(() => Boolean, { description: 'Resume a paused job' })
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
