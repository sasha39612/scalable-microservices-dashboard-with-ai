import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { Job, JobStatus, JobPriority } from '../../../common/src/types/common';

/**
 * Query parameters for listing tasks
 */
interface ListTasksQuery {
  status?: JobStatus;
  type?: string;
  priority?: JobPriority;
  limit?: number;
  offset?: number;
}

/**
 * Response for task list
 */
interface TaskListResponse {
  tasks: Job[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response for task logs
 */
interface TaskLogsResponse {
  taskId: string;
  logs: LogEntry[];
  total: number;
}

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Retry task request body
 */
interface RetryTaskDto {
  resetAttempts?: boolean;
}

/**
 * Create task request body
 */
interface CreateTaskDto {
  type: string;
  payload: Record<string, unknown>;
  priority?: JobPriority;
}

/**
 * Tasks Controller
 * Handles REST endpoints for task management, retry operations, and log viewing
 */
@Controller('tasks')
export class TasksController {
  // In-memory task storage (replace with actual database/queue integration)
  private tasks: Map<string, Job> = new Map();
  private taskLogs: Map<string, LogEntry[]> = new Map();

  constructor() {
    // Initialize with some sample data for demonstration
    this.initializeSampleTasks();
  }

  /**
   * POST /tasks
   * Create a new task
   */
  @Post()
  async createTask(@Body() createTaskDto: CreateTaskDto): Promise<Job> {
    const taskId = (this.tasks.size + 1).toString();
    
    const newTask: Job = {
      id: taskId,
      type: createTaskDto.type,
      status: JobStatus.Pending,
      priority: createTaskDto.priority || JobPriority.Normal,
      payload: createTaskDto.payload,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.tasks.set(taskId, newTask);

    // Add initial log entry
    this.addLog(taskId, {
      timestamp: new Date(),
      level: 'info',
      message: 'Task created',
      metadata: { type: createTaskDto.type },
    });

    return newTask;
  }

  /**
   * GET /tasks
   * Fetch all tasks with optional filtering
   */
  @Get()
  async getTasks(@Query() query: ListTasksQuery): Promise<TaskListResponse> {
    const { status, type, priority, limit = 50, offset = 0 } = query;

    let tasks = Array.from(this.tasks.values());

    // Apply filters
    if (status) {
      tasks = tasks.filter((task) => task.status === status);
    }
    if (type) {
      tasks = tasks.filter((task) => task.type === type);
    }
    if (priority) {
      tasks = tasks.filter((task) => task.priority === priority);
    }

    // Sort by creation date (newest first)
    tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = tasks.length;
    const paginatedTasks = tasks.slice(offset, offset + limit);

    return {
      tasks: paginatedTasks,
      total,
      limit,
      offset,
    };
  }

  /**
   * GET /tasks/:id
   * Fetch a specific task by ID
   */
  @Get(':id')
  async getTaskById(@Param('id') id: string): Promise<Job> {
    const task = this.tasks.get(id);

    if (!task) {
      throw new HttpException(
        `Task with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return task;
  }

  /**
   * POST /tasks/:id/retry
   * Retry a failed or cancelled task
   */
  @Post(':id/retry')
  async retryTask(
    @Param('id') id: string,
    @Body() body: RetryTaskDto,
  ): Promise<Job> {
    const task = this.tasks.get(id);

    if (!task) {
      throw new HttpException(
        `Task with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate that the task can be retried
    if (
      task.status !== JobStatus.Failed &&
      task.status !== JobStatus.Cancelled
    ) {
      throw new BadRequestException(
        `Task with status ${task.status} cannot be retried. Only failed or cancelled tasks can be retried.`,
      );
    }

    // Update task for retry
    const updatedTask: Job = {
      ...task,
      status: JobStatus.Pending,
      attempts: body.resetAttempts ? 0 : task.attempts,
      error: undefined,
      startedAt: undefined,
      completedAt: undefined,
      failedAt: undefined,
    };

    this.tasks.set(id, updatedTask);

    // Log the retry action
    this.addLog(id, {
      timestamp: new Date(),
      level: 'info',
      message: `Task retried${body.resetAttempts ? ' with reset attempts' : ''}`,
      metadata: { retriedBy: 'system', previousStatus: task.status },
    });

    return updatedTask;
  }

  /**
   * POST /tasks/:id/cancel
   * Cancel a pending or processing task
   */
  @Post(':id/cancel')
  async cancelTask(@Param('id') id: string): Promise<Job> {
    const task = this.tasks.get(id);

    if (!task) {
      throw new HttpException(
        `Task with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate that the task can be cancelled
    if (
      task.status !== JobStatus.Pending &&
      task.status !== JobStatus.Processing
    ) {
      throw new BadRequestException(
        `Task with status ${task.status} cannot be cancelled. Only pending or processing tasks can be cancelled.`,
      );
    }

    // Update task as cancelled
    const updatedTask: Job = {
      ...task,
      status: JobStatus.Cancelled,
      completedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);

    // Log the cancellation
    this.addLog(id, {
      timestamp: new Date(),
      level: 'info',
      message: 'Task cancelled',
      metadata: { cancelledBy: 'user', previousStatus: task.status },
    });

    return updatedTask;
  }

  /**
   * GET /tasks/:id/logs
   * View logs for a specific task
   */
  @Get(':id/logs')
  async getTaskLogs(
    @Param('id') id: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ): Promise<TaskLogsResponse> {
    const task = this.tasks.get(id);

    if (!task) {
      throw new HttpException(
        `Task with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const logs = this.taskLogs.get(id) || [];
    const total = logs.length;
    const paginatedLogs = logs.slice(offset, offset + limit);

    return {
      taskId: id,
      logs: paginatedLogs,
      total,
    };
  }

  /**
   * GET /tasks/stats/summary
   * Get task statistics summary
   */
  @Get('stats/summary')
  async getTaskStats() {
    const tasks = Array.from(this.tasks.values());

    const stats = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter((t) => t.status === JobStatus.Pending).length,
        processing: tasks.filter((t) => t.status === JobStatus.Processing)
          .length,
        completed: tasks.filter((t) => t.status === JobStatus.Completed).length,
        failed: tasks.filter((t) => t.status === JobStatus.Failed).length,
        cancelled: tasks.filter((t) => t.status === JobStatus.Cancelled).length,
        retrying: tasks.filter((t) => t.status === JobStatus.Retrying).length,
      },
      byPriority: {
        low: tasks.filter((t) => t.priority === JobPriority.Low).length,
        normal: tasks.filter((t) => t.priority === JobPriority.Normal).length,
        high: tasks.filter((t) => t.priority === JobPriority.High).length,
        critical: tasks.filter((t) => t.priority === JobPriority.Critical)
          .length,
      },
    };

    return stats;
  }

  /**
   * Helper method to add logs to a task
   */
  private addLog(taskId: string, log: LogEntry): void {
    if (!this.taskLogs.has(taskId)) {
      this.taskLogs.set(taskId, []);
    }
    this.taskLogs.get(taskId)!.push(log);
  }

  /**
   * Initialize sample tasks for demonstration
   */
  private initializeSampleTasks(): void {
    const sampleTasks: Job[] = [
      {
        id: '1',
        type: 'email',
        status: JobStatus.Completed,
        priority: JobPriority.Normal,
        payload: { to: 'user@example.com', subject: 'Welcome' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(Date.now() - 3600000),
        startedAt: new Date(Date.now() - 3500000),
        completedAt: new Date(Date.now() - 3400000),
      },
      {
        id: '2',
        type: 'cleanup',
        status: JobStatus.Failed,
        priority: JobPriority.Low,
        payload: { target: 'temp-files' },
        attempts: 3,
        maxAttempts: 3,
        createdAt: new Date(Date.now() - 7200000),
        startedAt: new Date(Date.now() - 7100000),
        failedAt: new Date(Date.now() - 7000000),
        error: 'Failed to access file system',
      },
      {
        id: '3',
        type: 'email',
        status: JobStatus.Processing,
        priority: JobPriority.High,
        payload: { to: 'admin@example.com', subject: 'Alert' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(Date.now() - 300000),
        startedAt: new Date(Date.now() - 200000),
      },
      {
        id: '4',
        type: 'data-sync',
        status: JobStatus.Pending,
        priority: JobPriority.Critical,
        payload: { source: 'database-a', target: 'database-b' },
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date(Date.now() - 60000),
      },
      {
        id: '5',
        type: 'report-generation',
        status: JobStatus.Cancelled,
        priority: JobPriority.Normal,
        payload: { reportId: 'report-123', format: 'pdf' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(Date.now() - 10800000),
        startedAt: new Date(Date.now() - 10700000),
        error: 'Cancelled by user',
      },
    ];

    // Populate tasks
    sampleTasks.forEach((task) => {
      this.tasks.set(task.id, task);

      // Add sample logs
      const logs: LogEntry[] = [
        {
          timestamp: task.createdAt,
          level: 'info',
          message: `Task created with type: ${task.type}`,
          metadata: { priority: task.priority },
        },
      ];

      if (task.startedAt) {
        logs.push({
          timestamp: task.startedAt,
          level: 'info',
          message: 'Task processing started',
          metadata: { attempt: task.attempts },
        });
      }

      if (task.completedAt) {
        logs.push({
          timestamp: task.completedAt,
          level: 'info',
          message: 'Task completed successfully',
        });
      }

      if (task.failedAt && task.error) {
        logs.push({
          timestamp: task.failedAt,
          level: 'error',
          message: `Task failed: ${task.error}`,
          metadata: { attempts: task.attempts, maxAttempts: task.maxAttempts },
        });
      }

      this.taskLogs.set(task.id, logs);
    });
  }
}
