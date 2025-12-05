import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Cacheable, CacheInvalidate } from '../decorators/cache.decorators';
import { CacheService } from './cache.service';

interface Task {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  priority: number;
  payload: Record<string, unknown>;
  result?: unknown;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
}

interface Job {
  id: string;
  name: string;
  type?: string;
  schedule?: string;
  status: 'active' | 'paused' | 'failed';
  payload?: Record<string, unknown>;
  lastRun?: Date;
  nextRun?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateTaskDto {
  type: string;
  payload: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | number;
}

interface CreateJobDto {
  name: string;
  type: string;
  schedule: string;
  payload: Record<string, unknown>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

@Injectable()
export class WorkerClient {
  private readonly workerServiceUrl: string;
  private readonly apiKey: string;
  private readonly logger = new Logger('WorkerClient');

  constructor(private readonly cacheService: CacheService) {
    this.workerServiceUrl = process.env.WORKER_SERVICE_URL || 'http://worker-service:4001';
    this.apiKey = process.env.WORKER_SERVICE_API_KEY || '';
    
    if (!this.apiKey) {
      this.logger.warn('⚠️  WORKER_SERVICE_API_KEY not set. Inter-service authentication disabled!');
    }
  }

  /**
   * Get headers with API key
   */
  private getHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...additionalHeaders,
    };
  }

  /**
   * Create a new task in the Worker Service
   */
  @CacheInvalidate({ patterns: ['worker:tasks:*', 'worker:stats:*'] })
  async createTask(taskDto: CreateTaskDto): Promise<Task> {
    try {
      this.logger.log(`Creating task of type: ${taskDto.type}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(taskDto),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to create task',
          response.status,
        );
      }

      const task = await response.json();
      this.logger.log(`Task created successfully: ${task.id}`);
      return task;
    } catch (error) {
      this.logger.error(`Failed to create task: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get task by ID
   */
  @Cacheable({ key: 'worker:task:{{0}}', ttl: 60 })
  async getTask(taskId: string): Promise<Task> {
    try {
      this.logger.log(`Fetching task: ${taskId}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/tasks/${taskId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to fetch task',
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch task: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get all tasks with optional filtering
   */
  @Cacheable({ 
    key: (filters) => `worker:tasks:${JSON.stringify(filters || {})}`, 
    ttl: 30 
  })
  async getTasks(filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: Task[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());

      const url = `${this.workerServiceUrl}/api/tasks?${queryParams.toString()}`;
      this.logger.log(`Fetching tasks with filters: ${queryParams.toString()}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new HttpException(
          'Failed to fetch tasks',
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch tasks: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Cancel a task
   */
  @CacheInvalidate({ 
    keys: ['worker:task:{{0}}'], 
    patterns: ['worker:tasks:*'] 
  })
  async cancelTask(taskId: string): Promise<void> {
    try {
      this.logger.log(`Cancelling task: ${taskId}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to cancel task',
          response.status,
        );
      }

      this.logger.log(`Task cancelled successfully: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel task: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Retry a failed or cancelled task
   */
  @CacheInvalidate({ 
    keys: ['worker:task:{{0}}'], 
    patterns: ['worker:tasks:*'] 
  })
  async retryTask(taskId: string, resetAttempts?: boolean): Promise<Task> {
    try {
      this.logger.log(`Retrying task: ${taskId}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/tasks/${taskId}/retry`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ resetAttempts: resetAttempts || false }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
        }
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to retry task',
          response.status,
        );
      }

      const task = await response.json();
      this.logger.log(`Task retry initiated successfully: ${taskId}`);
      return task;
    } catch (error) {
      this.logger.error(`Failed to retry task: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Create a scheduled job
   */
  async createJob(jobDto: CreateJobDto): Promise<Job> {
    try {
      this.logger.log(`Creating job: ${jobDto.name}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/jobs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(jobDto),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to create job',
          response.status,
        );
      }

      const job = await response.json();
      this.logger.log(`Job created successfully: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to create job: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get all jobs
   */
  async getJobs(): Promise<Job[]> {
    try {
      this.logger.log('Fetching all jobs');
      
      const response = await fetch(`${this.workerServiceUrl}/api/jobs`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new HttpException(
          'Failed to fetch jobs',
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch jobs: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job> {
    try {
      this.logger.log(`Fetching job: ${jobId}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/jobs/${jobId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to fetch job',
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch job: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Pause a job
   */
  async pauseJob(jobId: string): Promise<void> {
    try {
      this.logger.log(`Pausing job: ${jobId}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/jobs/${jobId}/pause`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to pause job',
          response.status,
        );
      }

      this.logger.log(`Job paused successfully: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to pause job: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Resume a paused job
   */
  async resumeJob(jobId: string): Promise<void> {
    try {
      this.logger.log(`Resuming job: ${jobId}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/jobs/${jobId}/resume`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to resume job',
          response.status,
        );
      }

      this.logger.log(`Job resumed successfully: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to resume job: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      this.logger.log(`Deleting job: ${jobId}`);
      
      const response = await fetch(`${this.workerServiceUrl}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to delete job',
          response.status,
        );
      }

      this.logger.log(`Job deleted successfully: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to delete job: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Health check for Worker Service
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      const response = await fetch(`${this.workerServiceUrl}/health`);
      
      if (!response.ok) {
        throw new Error('Worker Service health check failed');
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Worker Service health check failed: ${getErrorMessage(error)}`);
      throw new HttpException(
        'Worker Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
