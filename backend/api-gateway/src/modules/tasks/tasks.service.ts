import { Injectable } from '@nestjs/common';
import { WorkerClient } from '../../services/worker.client';
import { Task, Job, TasksResponse, CreateTaskInput, CreateJobInput, TaskFiltersInput, TaskStatus, JobStatus } from './tasks.model';

@Injectable()
export class TasksService {
  constructor(private readonly workerClient: WorkerClient) {}

  async createTask(input: CreateTaskInput): Promise<Task> {
    // Map GraphQL priority to Worker Service priority (numeric values)
    let priority: number | undefined;
    if (input.priority) {
      const priorityMap: Record<string, number> = {
        'low': 1,
        'normal': 5,
        'high': 10,
      };
      priority = priorityMap[input.priority];
    }

    const task = await this.workerClient.createTask({
      type: input.type,
      payload: input.payload,
      priority,
    });

    return this.mapWorkerTaskToGraphQL(task);
  }

  async getTask(taskId: string): Promise<Task> {
    const task = await this.workerClient.getTask(taskId);
    return this.mapWorkerTaskToGraphQL(task);
  }

  async getTasks(filters?: TaskFiltersInput): Promise<TasksResponse> {
    const result = await this.workerClient.getTasks(filters);
    return {
      ...result,
      tasks: result.tasks.map(task => this.mapWorkerTaskToGraphQL(task)),
    };
  }

  async cancelTask(taskId: string): Promise<boolean> {
    await this.workerClient.cancelTask(taskId);
    return true;
  }

  async retryTask(taskId: string, resetAttempts?: boolean): Promise<Task> {
    const task = await this.workerClient.retryTask(taskId, resetAttempts);
    return this.mapWorkerTaskToGraphQL(task);
  }

  async createJob(input: CreateJobInput): Promise<Job> {
    const job = await this.workerClient.createJob({
      name: input.name,
      type: input.type,
      schedule: input.schedule,
      payload: input.payload,
    });
    return this.mapWorkerJobToGraphQL(job);
  }

  async getJobs(): Promise<Job[]> {
    const jobs = await this.workerClient.getJobs();
    return jobs.map(job => this.mapWorkerJobToGraphQL(job));
  }

  async getJob(jobId: string): Promise<Job> {
    const job = await this.workerClient.getJob(jobId);
    return this.mapWorkerJobToGraphQL(job);
  }

  async pauseJob(jobId: string): Promise<boolean> {
    await this.workerClient.pauseJob(jobId);
    return true;
  }

  async resumeJob(jobId: string): Promise<boolean> {
    await this.workerClient.resumeJob(jobId);
    return true;
  }

  async deleteJob(jobId: string): Promise<boolean> {
    await this.workerClient.deleteJob(jobId);
    return true;
  }

  /**
   * Map Worker Service task status to GraphQL TaskStatus
   */
  private mapWorkerTaskToGraphQL(workerTask: {
    id: string;
    type: string;
    status: string;
    priority?: number;
    payload: Record<string, unknown>;
    result?: unknown;
    error?: string;
    attempts?: number;
    maxAttempts?: number;
    createdAt: Date | string;
    updatedAt?: Date | string;
    startedAt?: Date | string;
    completedAt?: Date | string;
    failedAt?: Date | string;
  }): Task {
    const statusMap: Record<string, TaskStatus> = {
      'pending': TaskStatus.PENDING,
      'processing': TaskStatus.IN_PROGRESS,
      'retrying': TaskStatus.IN_PROGRESS,
      'completed': TaskStatus.COMPLETED,
      'failed': TaskStatus.FAILED,
      'cancelled': TaskStatus.FAILED,
    };

    return {
      id: workerTask.id,
      type: workerTask.type,
      status: statusMap[workerTask.status] || TaskStatus.PENDING,
      payload: workerTask.payload,
      result: workerTask.result,
      error: workerTask.error,
      createdAt: new Date(workerTask.createdAt),
      updatedAt: new Date(workerTask.updatedAt || workerTask.createdAt),
    };
  }

  /**
   * Map Worker Service job to GraphQL Job
   */
  private mapWorkerJobToGraphQL(workerJob: {
    id: string;
    name: string;
    type?: string;
    schedule?: string;
    status: string;
    payload?: Record<string, unknown>;
    lastRun?: Date | string;
    nextRun?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }): Job {
    const statusMap: Record<string, JobStatus> = {
      'active': JobStatus.ACTIVE,
      'paused': JobStatus.PAUSED,
      'failed': JobStatus.FAILED,
    };

    return {
      id: workerJob.id,
      name: workerJob.name,
      schedule: workerJob.schedule,
      status: statusMap[workerJob.status] || JobStatus.ACTIVE,
      lastRun: workerJob.lastRun ? new Date(workerJob.lastRun) : undefined,
      nextRun: workerJob.nextRun ? new Date(workerJob.nextRun) : undefined,
    };
  }
}
