import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Job, JobStatus, JobPriority } from '../../../common/src/types/common';

/**
 * Log entry structure for task logging
 */
export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Options for retrying a task
 */
export interface RetryTaskOptions {
  resetAttempts?: boolean;
  priority?: JobPriority;
  delayMs?: number;
}

/**
 * Response for task status query
 */
export interface TaskStatusResponse {
  task: Job;
  logs: LogEntry[];
  canRetry: boolean;
  estimatedRetryTime?: Date;
}

/**
 * Response for task logs query
 */
export interface TaskLogsResponse {
  taskId: string;
  logs: LogEntry[];
  total: number;
}

/**
 * Queue Service
 * Manages background job queue operations including task status, retry, and logging
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  
  // In-memory storage (replace with Redis or database in production)
  private tasks: Map<string, Job> = new Map();
  private taskLogs: Map<string, LogEntry[]> = new Map();
  private taskQueue: Job[] = [];

  constructor() {
    this.logger.log('QueueService initialized');
  }

  /**
   * Get the current status of a task
   * @param taskId - The unique identifier of the task
   * @returns Task status with logs and retry information
   * @throws NotFoundException if task doesn't exist
   */
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const logs = this.taskLogs.get(taskId) || [];
    const canRetry = this.canTaskBeRetried(task);
    const estimatedRetryTime = this.calculateRetryTime(task);

    this.logger.debug(`Retrieved status for task ${taskId}: ${task.status}`);

    return {
      task,
      logs,
      canRetry,
      estimatedRetryTime,
    };
  }

  /**
   * Retry a failed or cancelled task
   * @param taskId - The unique identifier of the task
   * @param options - Options for the retry operation
   * @returns The updated task
   * @throws NotFoundException if task doesn't exist
   * @throws BadRequestException if task cannot be retried
   */
  async retryTask(taskId: string, options: RetryTaskOptions = {}): Promise<Job> {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Validate that the task can be retried
    if (!this.canTaskBeRetried(task)) {
      const reason = this.getRetryFailureReason(task);
      throw new BadRequestException(
        `Task with ID ${taskId} cannot be retried. Reason: ${reason}`
      );
    }

    const previousStatus = task.status;
    const previousAttempts = task.attempts;

    // Update task for retry
    const updatedTask: Job = {
      ...task,
      status: JobStatus.Pending,
      attempts: options.resetAttempts ? 0 : task.attempts,
      priority: options.priority ?? task.priority,
      error: undefined,
      startedAt: undefined,
      completedAt: undefined,
      failedAt: undefined,
    };

    // Update task in storage
    this.tasks.set(taskId, updatedTask);

    // Add task back to queue
    this.addToQueue(updatedTask, options.delayMs);

    // Log the retry action
    this.addLog(taskId, {
      timestamp: new Date(),
      level: 'info',
      message: `Task retried${options.resetAttempts ? ' with reset attempts' : ''}`,
      metadata: {
        previousStatus,
        previousAttempts,
        newPriority: updatedTask.priority,
        delayMs: options.delayMs,
      },
    });

    this.logger.log(
      `Task ${taskId} retried. Previous status: ${previousStatus}, Previous attempts: ${previousAttempts}`
    );

    return updatedTask;
  }

  /**
   * Get logs for a specific task
   * @param taskId - The unique identifier of the task
   * @param limit - Maximum number of logs to return
   * @param offset - Number of logs to skip
   * @returns Task logs with pagination
   * @throws NotFoundException if task doesn't exist
   */
  async getLogs(
    taskId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<TaskLogsResponse> {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const logs = this.taskLogs.get(taskId) || [];
    const total = logs.length;

    // Sort logs by timestamp (newest first)
    const sortedLogs = [...logs].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Apply pagination
    const paginatedLogs = sortedLogs.slice(offset, offset + limit);

    this.logger.debug(`Retrieved ${paginatedLogs.length} logs for task ${taskId}`);

    return {
      taskId,
      logs: paginatedLogs,
      total,
    };
  }

  /**
   * Add a new task to the queue
   * @param task - The task to add
   */
  async addTask(task: Job): Promise<Job> {
    this.tasks.set(task.id, task);
    this.taskQueue.push(task);

    this.addLog(task.id, {
      timestamp: new Date(),
      level: 'info',
      message: `Task created with type: ${task.type}`,
      metadata: {
        priority: task.priority,
        maxAttempts: task.maxAttempts,
      },
    });

    this.logger.log(`Task ${task.id} added to queue with type: ${task.type}`);

    return task;
  }

  /**
   * Update task status
   * @param taskId - The unique identifier of the task
   * @param status - The new status
   * @param error - Optional error message
   */
  async updateTaskStatus(
    taskId: string,
    status: JobStatus,
    error?: string
  ): Promise<Job> {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const now = new Date();
    const updatedTask: Job = {
      ...task,
      status,
      error,
    };

    // Update timestamps based on status
    switch (status) {
      case JobStatus.Processing:
        updatedTask.startedAt = now;
        updatedTask.attempts = task.attempts + 1;
        break;
      case JobStatus.Completed:
        updatedTask.completedAt = now;
        break;
      case JobStatus.Failed:
        updatedTask.failedAt = now;
        break;
    }

    this.tasks.set(taskId, updatedTask);

    // Add log entry
    const logLevel = status === JobStatus.Failed ? 'error' : 'info';
    const logMessage = error
      ? `Task ${status}: ${error}`
      : `Task status changed to: ${status}`;

    this.addLog(taskId, {
      timestamp: now,
      level: logLevel,
      message: logMessage,
      metadata: { attempts: updatedTask.attempts, status },
    });

    this.logger.log(`Task ${taskId} status updated to: ${status}`);

    return updatedTask;
  }

  /**
   * Get all tasks
   * @returns Array of all tasks
   */
  getAllTasks(): Job[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID
   * @param taskId - The unique identifier of the task
   * @returns The task if found
   */
  getTask(taskId: string): Job | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Delete a task and its logs
   * @param taskId - The unique identifier of the task
   */
  async deleteTask(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
    this.taskLogs.delete(taskId);
    this.taskQueue = this.taskQueue.filter((t) => t.id !== taskId);
    
    this.logger.log(`Task ${taskId} deleted`);
  }

  /**
   * Check if a task can be retried
   * @param task - The task to check
   * @returns True if the task can be retried
   */
  private canTaskBeRetried(task: Job): boolean {
    // Task must be in failed or cancelled status
    if (task.status !== JobStatus.Failed && task.status !== JobStatus.Cancelled) {
      return false;
    }

    // Task must not have exceeded max attempts
    if (task.attempts >= task.maxAttempts) {
      return false;
    }

    return true;
  }

  /**
   * Get the reason why a task cannot be retried
   * @param task - The task to check
   * @returns Human-readable reason
   */
  private getRetryFailureReason(task: Job): string {
    if (
      task.status !== JobStatus.Failed &&
      task.status !== JobStatus.Cancelled
    ) {
      return `Task status is ${task.status}. Only failed or cancelled tasks can be retried.`;
    }

    if (task.attempts >= task.maxAttempts) {
      return `Task has reached maximum retry attempts (${task.maxAttempts}).`;
    }

    return 'Unknown reason';
  }

  /**
   * Calculate estimated retry time based on exponential backoff
   * @param task - The task to calculate retry time for
   * @returns Estimated retry time or undefined if cannot retry
   */
  private calculateRetryTime(task: Job): Date | undefined {
    if (!this.canTaskBeRetried(task)) {
      return undefined;
    }

    // Exponential backoff: 2^attempts * 1000ms
    const delayMs = Math.pow(2, task.attempts) * 1000;
    const retryTime = new Date(Date.now() + delayMs);

    return retryTime;
  }

  /**
   * Add a task to the queue with optional delay
   * @param task - The task to add
   * @param delayMs - Optional delay in milliseconds
   */
  private addToQueue(task: Job, delayMs?: number): void {
    if (delayMs && delayMs > 0) {
      // Schedule task to be added later
      setTimeout(() => {
        this.taskQueue.push(task);
        this.logger.debug(`Task ${task.id} added to queue after ${delayMs}ms delay`);
      }, delayMs);
    } else {
      this.taskQueue.push(task);
    }
  }

  /**
   * Add a log entry for a task
   * @param taskId - The unique identifier of the task
   * @param log - The log entry to add
   */
  private addLog(taskId: string, log: LogEntry): void {
    if (!this.taskLogs.has(taskId)) {
      this.taskLogs.set(taskId, []);
    }
    this.taskLogs.get(taskId)!.push(log);
  }

  /**
   * Get next task from queue (for processing)
   * @returns Next task or undefined if queue is empty
   */
  async getNextTask(): Promise<Job | undefined> {
    // Sort by priority (higher first) and creation time (older first)
    this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Get pending tasks only
    const nextTask = this.taskQueue.find((t) => t.status === JobStatus.Pending);

    if (nextTask) {
      // Remove from queue
      this.taskQueue = this.taskQueue.filter((t) => t.id !== nextTask.id);
      this.logger.debug(`Next task retrieved from queue: ${nextTask.id}`);
    }

    return nextTask;
  }

  /**
   * Get queue statistics
   * @returns Queue statistics
   */
  getQueueStats() {
    const tasks = Array.from(this.tasks.values());

    return {
      total: tasks.length,
      queued: this.taskQueue.length,
      byStatus: {
        pending: tasks.filter((t) => t.status === JobStatus.Pending).length,
        processing: tasks.filter((t) => t.status === JobStatus.Processing).length,
        completed: tasks.filter((t) => t.status === JobStatus.Completed).length,
        failed: tasks.filter((t) => t.status === JobStatus.Failed).length,
        cancelled: tasks.filter((t) => t.status === JobStatus.Cancelled).length,
        retrying: tasks.filter((t) => t.status === JobStatus.Retrying).length,
      },
      byPriority: {
        low: tasks.filter((t) => t.priority === JobPriority.Low).length,
        normal: tasks.filter((t) => t.priority === JobPriority.Normal).length,
        high: tasks.filter((t) => t.priority === JobPriority.High).length,
        critical: tasks.filter((t) => t.priority === JobPriority.Critical).length,
      },
    };
  }
}
