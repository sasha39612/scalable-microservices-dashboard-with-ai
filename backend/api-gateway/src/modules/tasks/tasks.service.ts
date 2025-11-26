import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerClient } from '../../services/worker.client';
import { TasksResponse, CreateTaskInput, CreateJobInput, TaskFiltersInput, TaskStatus, JobStatus, TaskPriority } from './tasks.model';
import { Task } from './entities/task.entity';
import { Job } from './entities/job.entity';

@Injectable()
export class TasksService {
  constructor(
    private readonly workerClient: WorkerClient,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /**
   * Check if a string is a valid UUID
   */
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

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

    const workerTask = await this.workerClient.createTask({
      type: input.type,
      payload: input.payload,
      priority,
    });

    // Convert worker task to GraphQL format
    const task = this.mapWorkerTaskToGraphQL(workerTask);
    
    // Only save to database if ID is a valid UUID
    if (this.isValidUUID(task.id)) {
      try {
        await this.taskRepository.save(task);
      } catch {
        // Ignore database errors for caching - error logged at repository level
      }
    }
    
    return task;
  }

  async getTask(taskId: string): Promise<Task> {
    // Try to get from database first (only if it's a valid UUID)
    if (this.isValidUUID(taskId)) {
      const cachedTask = await this.taskRepository.findOne({ where: { id: taskId } });
      if (cachedTask) {
        return cachedTask;
      }
    }

    // Fallback to worker service
    const workerTask = await this.workerClient.getTask(taskId);
    const task = this.mapWorkerTaskToGraphQL(workerTask);
    
    // Only save to database if ID is a valid UUID
    if (this.isValidUUID(task.id)) {
      try {
        await this.taskRepository.save(task);
      } catch {
        // Ignore database errors for caching - error logged at repository level
      }
    }
    
    return task;
  }

  async getTasks(filters?: TaskFiltersInput): Promise<TasksResponse> {
    // Get from worker service (real-time data)
    const result = await this.workerClient.getTasks(filters);
    const tasks = result.tasks.map(task => this.mapWorkerTaskToGraphQL(task));
    
    // Update database cache (only for tasks with valid UUIDs)
    for (const task of tasks) {
      if (this.isValidUUID(task.id)) {
        try {
          await this.taskRepository.save(task);
        } catch {
          // Ignore database errors for caching - error logged at repository level
        }
      }
    }
    
    return {
      ...result,
      tasks,
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
    const workerJob = await this.workerClient.createJob({
      name: input.name,
      type: input.type,
      schedule: input.schedule,
      payload: input.payload,
    });
    
    const job = this.mapWorkerJobToGraphQL(workerJob);
    
    // Don't save jobs to database - they're managed by worker service
    // The integer IDs from worker service don't match our UUID schema
    return job;
  }

  async getJobs(): Promise<Job[]> {
    const workerJobs = await this.workerClient.getJobs();
    const jobs = workerJobs.map(job => this.mapWorkerJobToGraphQL(job));
    
    // Don't cache jobs in database - they're managed by worker service
    // The integer IDs from worker service don't match our UUID schema
    return jobs;
  }

  async getJob(jobId: string): Promise<Job> {
    // Get directly from worker service
    // Don't use database cache since worker service uses integer IDs
    const workerJob = await this.workerClient.getJob(jobId);
    const job = this.mapWorkerJobToGraphQL(workerJob);
    
    return job;
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

    const priorityMap: Record<number, TaskPriority> = {
      1: TaskPriority.LOW,
      5: TaskPriority.NORMAL,
      10: TaskPriority.HIGH,
    };

    return {
      id: workerTask.id,
      type: workerTask.type,
      status: statusMap[workerTask.status] || TaskStatus.PENDING,
      priority: priorityMap[workerTask.priority || 5] || TaskPriority.NORMAL,
      payload: workerTask.payload,
      result: workerTask.result,
      error: workerTask.error,
      createdAt: new Date(workerTask.createdAt),
      updatedAt: new Date(workerTask.updatedAt || workerTask.createdAt),
    } as Task;
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
      createdAt: workerJob.createdAt ? new Date(workerJob.createdAt) : new Date(),
      updatedAt: workerJob.updatedAt ? new Date(workerJob.updatedAt) : new Date(),
    } as Job;
  }
}
