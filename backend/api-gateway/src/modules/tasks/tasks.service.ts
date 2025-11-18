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

    // Save to database
    const task = this.taskRepository.create({
      type: input.type,
      status: TaskStatus.PENDING,
      priority: (input.priority as TaskPriority) || TaskPriority.NORMAL,
      payload: input.payload,
    });
    
    const savedTask = await this.taskRepository.save(task);
    
    // Update with worker task ID
    savedTask.id = workerTask.id;
    await this.taskRepository.save(savedTask);
    
    return savedTask;
  }

  async getTask(taskId: string): Promise<Task> {
    // Try to get from database first
    const cachedTask = await this.taskRepository.findOne({ where: { id: taskId } });
    if (cachedTask) {
      return cachedTask;
    }

    // Fallback to worker service
    const workerTask = await this.workerClient.getTask(taskId);
    const task = this.mapWorkerTaskToGraphQL(workerTask);
    
    // Save to database
    await this.taskRepository.save(task);
    return task;
  }

  async getTasks(filters?: TaskFiltersInput): Promise<TasksResponse> {
    // Get from worker service (real-time data)
    const result = await this.workerClient.getTasks(filters);
    const tasks = result.tasks.map(task => this.mapWorkerTaskToGraphQL(task));
    
    // Update database cache
    for (const task of tasks) {
      await this.taskRepository.save(task);
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
    
    // Save to database
    await this.jobRepository.save(job);
    return job;
  }

  async getJobs(): Promise<Job[]> {
    const workerJobs = await this.workerClient.getJobs();
    const jobs = workerJobs.map(job => this.mapWorkerJobToGraphQL(job));
    
    // Update database cache
    for (const job of jobs) {
      await this.jobRepository.save(job);
    }
    
    return jobs;
  }

  async getJob(jobId: string): Promise<Job> {
    // Try database first
    const cachedJob = await this.jobRepository.findOne({ where: { id: jobId } });
    if (cachedJob) {
      return cachedJob;
    }
    
    // Fallback to worker service
    const workerJob = await this.workerClient.getJob(jobId);
    const job = this.mapWorkerJobToGraphQL(workerJob);
    
    // Save to database
    await this.jobRepository.save(job);
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
