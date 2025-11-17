import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QueueService, RetryTaskOptions, TaskStatusResponse, TaskLogsResponse } from '../../src/services/queue.service';
import { Job, JobStatus, JobPriority } from '../../../common/src/types/common';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueService],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    // Clear all tasks after each test
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('addTask', () => {
    it('should add a new task to the queue', async () => {
      const task: Job = {
        id: 'test-1',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      const result = await service.addTask(task);

      expect(result).toEqual(task);
      expect(result.id).toBe('test-1');
    });

    it('should add task with high priority', async () => {
      const task: Job = {
        id: 'test-2',
        type: 'critical-task',
        status: JobStatus.Pending,
        priority: JobPriority.Critical,
        payload: { data: 'urgent' },
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date(),
      };

      const result = await service.addTask(task);

      expect(result.priority).toBe(JobPriority.Critical);
      expect(result.maxAttempts).toBe(5);
    });
  });

  describe('getTaskStatus', () => {
    it('should return task status with logs', async () => {
      const task: Job = {
        id: 'test-status',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(task);
      const result = await service.getTaskStatus('test-status');

      expect(result).toHaveProperty('task');
      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('canRetry');
      expect(result.task.id).toBe('test-status');
    });

    it('should throw NotFoundException for non-existent task', async () => {
      await expect(service.getTaskStatus('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should indicate if task can be retried', async () => {
      const failedTask: Job = {
        id: 'failed-task',
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Connection timeout',
      };

      await service.addTask(failedTask);
      await service.updateTaskStatus('failed-task', JobStatus.Failed, 'Connection timeout');

      const result = await service.getTaskStatus('failed-task');

      expect(result.canRetry).toBe(true);
      expect(result.estimatedRetryTime).toBeDefined();
    });

    it('should indicate task cannot be retried when max attempts reached', async () => {
      const failedTask: Job = {
        id: 'max-attempts-task',
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 3,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Max attempts reached',
      };

      await service.addTask(failedTask);
      await service.updateTaskStatus('max-attempts-task', JobStatus.Failed, 'Max attempts reached');

      const result = await service.getTaskStatus('max-attempts-task');

      expect(result.canRetry).toBe(false);
      expect(result.estimatedRetryTime).toBeUndefined();
    });
  });

  describe('retryTask', () => {
    it('should successfully retry a failed task', async () => {
      const failedTask: Job = {
        id: 'retry-test',
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Temporary error',
      };

      await service.addTask(failedTask);
      await service.updateTaskStatus('retry-test', JobStatus.Failed, 'Temporary error');

      const result = await service.retryTask('retry-test');

      expect(result.status).toBe(JobStatus.Pending);
      expect(result.error).toBeUndefined();
      expect(result.startedAt).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
      expect(result.failedAt).toBeUndefined();
    });

    it('should retry with reset attempts option', async () => {
      const failedTask: Job = {
        id: 'retry-reset',
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 2,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Temporary error',
      };

      await service.addTask(failedTask);
      await service.updateTaskStatus('retry-reset', JobStatus.Failed, 'Temporary error');

      const options: RetryTaskOptions = { resetAttempts: true };
      const result = await service.retryTask('retry-reset', options);

      expect(result.attempts).toBe(0);
      expect(result.status).toBe(JobStatus.Pending);
    });

    it('should retry with different priority', async () => {
      const failedTask: Job = {
        id: 'retry-priority',
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Temporary error',
      };

      await service.addTask(failedTask);
      await service.updateTaskStatus('retry-priority', JobStatus.Failed, 'Temporary error');

      const options: RetryTaskOptions = { priority: JobPriority.High };
      const result = await service.retryTask('retry-priority', options);

      expect(result.priority).toBe(JobPriority.High);
    });

    it('should throw NotFoundException for non-existent task', async () => {
      await expect(service.retryTask('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for task that cannot be retried', async () => {
      const completedTask: Job = {
        id: 'completed-task',
        type: 'email',
        status: JobStatus.Completed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      await service.addTask(completedTask);
      await service.updateTaskStatus('completed-task', JobStatus.Completed);

      await expect(service.retryTask('completed-task')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when max attempts reached', async () => {
      const maxAttemptsTask: Job = {
        id: 'max-task',
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 3,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Max attempts reached',
      };

      await service.addTask(maxAttemptsTask);
      await service.updateTaskStatus('max-task', JobStatus.Failed, 'Max attempts reached');

      await expect(service.retryTask('max-task')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getLogs', () => {
    it('should return logs for a task', async () => {
      const task: Job = {
        id: 'log-test',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(task);
      const result = await service.getLogs('log-test');

      expect(result).toHaveProperty('taskId', 'log-test');
      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result.logs.length).toBeGreaterThan(0);
    });

    it('should return paginated logs', async () => {
      const task: Job = {
        id: 'log-pagination',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(task);
      
      // Add status updates to generate more logs
      await service.updateTaskStatus('log-pagination', JobStatus.Processing);
      await service.updateTaskStatus('log-pagination', JobStatus.Completed);

      const result = await service.getLogs('log-pagination', 2, 0);

      expect(result.logs.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(result.logs.length);
    });

    it('should throw NotFoundException for non-existent task', async () => {
      await expect(service.getLogs('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should sort logs by timestamp descending', async () => {
      const task: Job = {
        id: 'log-sort',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(Date.now() - 1000),
      };

      await service.addTask(task);
      
      // Wait a bit and add more logs
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.updateTaskStatus('log-sort', JobStatus.Processing);

      const result = await service.getLogs('log-sort');

      expect(result.logs.length).toBeGreaterThan(1);
      
      // Check that logs are sorted by timestamp descending (newest first)
      for (let i = 0; i < result.logs.length - 1; i++) {
        const currentTime = new Date(result.logs[i].timestamp).getTime();
        const nextTime = new Date(result.logs[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status to Processing', async () => {
      const task: Job = {
        id: 'status-test',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(task);
      const result = await service.updateTaskStatus('status-test', JobStatus.Processing);

      expect(result.status).toBe(JobStatus.Processing);
      expect(result.startedAt).toBeDefined();
      expect(result.attempts).toBe(1);
    });

    it('should update task status to Completed', async () => {
      const task: Job = {
        id: 'complete-test',
        type: 'email',
        status: JobStatus.Processing,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        startedAt: new Date(),
      };

      await service.addTask(task);
      const result = await service.updateTaskStatus('complete-test', JobStatus.Completed);

      expect(result.status).toBe(JobStatus.Completed);
      expect(result.completedAt).toBeDefined();
    });

    it('should update task status to Failed with error message', async () => {
      const task: Job = {
        id: 'fail-test',
        type: 'email',
        status: JobStatus.Processing,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        startedAt: new Date(),
      };

      await service.addTask(task);
      const errorMessage = 'Connection timeout';
      const result = await service.updateTaskStatus('fail-test', JobStatus.Failed, errorMessage);

      expect(result.status).toBe(JobStatus.Failed);
      expect(result.failedAt).toBeDefined();
      expect(result.error).toBe(errorMessage);
    });

    it('should throw NotFoundException for non-existent task', async () => {
      await expect(
        service.updateTaskStatus('non-existent', JobStatus.Completed),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add log entry when status is updated', async () => {
      const task: Job = {
        id: 'log-status-test',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(task);
      await service.updateTaskStatus('log-status-test', JobStatus.Processing);

      const logs = await service.getLogs('log-status-test');
      
      expect(logs.logs.length).toBeGreaterThan(1);
      // Check that the log contains information about status change
      expect(logs.logs.some(log => log.message.includes('Processing') || log.message.includes('status'))).toBe(true);
    });
  });

  describe('getTask', () => {
    it('should return task by ID', async () => {
      const task: Job = {
        id: 'get-test',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(task);
      const result = service.getTask('get-test');

      expect(result).toBeDefined();
      expect(result?.id).toBe('get-test');
    });

    it('should return undefined for non-existent task', () => {
      const result = service.getTask('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      const task1: Job = {
        id: 'all-1',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test1@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      const task2: Job = {
        id: 'all-2',
        type: 'cleanup',
        status: JobStatus.Processing,
        priority: JobPriority.High,
        payload: { target: 'temp' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(task1);
      await service.addTask(task2);

      const result = service.getAllTasks();

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some(t => t.id === 'all-1')).toBe(true);
      expect(result.some(t => t.id === 'all-2')).toBe(true);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task and its logs', async () => {
      const task: Job = {
        id: 'delete-test',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(task);
      expect(service.getTask('delete-test')).toBeDefined();

      await service.deleteTask('delete-test');
      expect(service.getTask('delete-test')).toBeUndefined();
    });
  });

  describe('getNextTask', () => {
    it('should return next pending task sorted by priority', async () => {
      const lowPriorityTask: Job = {
        id: 'next-low',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Low,
        payload: { to: 'test1@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(Date.now() - 1000),
      };

      const highPriorityTask: Job = {
        id: 'next-high',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.High,
        payload: { to: 'test2@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(lowPriorityTask);
      await service.addTask(highPriorityTask);

      const nextTask = await service.getNextTask();

      expect(nextTask).toBeDefined();
      expect(nextTask?.id).toBe('next-high'); // Higher priority should come first
    });

    it('should return older task when priorities are equal', async () => {
      const olderTask: Job = {
        id: 'next-old',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test1@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(Date.now() - 2000),
      };

      const newerTask: Job = {
        id: 'next-new',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test2@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      await service.addTask(olderTask);
      await service.addTask(newerTask);

      const nextTask = await service.getNextTask();

      expect(nextTask).toBeDefined();
      expect(nextTask?.id).toBe('next-old'); // Older task should come first with same priority
    });

    it('should return undefined when no pending tasks exist', async () => {
      const completedTask: Job = {
        id: 'next-completed',
        type: 'email',
        status: JobStatus.Completed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      await service.addTask(completedTask);

      const nextTask = await service.getNextTask();

      expect(nextTask).toBeUndefined();
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const pendingTask: Job = {
        id: 'stats-pending',
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: {},
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };

      const completedTask: Job = {
        id: 'stats-completed',
        type: 'cleanup',
        status: JobStatus.Completed,
        priority: JobPriority.High,
        payload: {},
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      const failedTask: Job = {
        id: 'stats-failed',
        type: 'data-sync',
        status: JobStatus.Failed,
        priority: JobPriority.Critical,
        payload: {},
        attempts: 3,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Failed',
      };

      await service.addTask(pendingTask);
      await service.addTask(completedTask);
      await service.addTask(failedTask);

      const stats = service.getQueueStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('queued');
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byPriority');
      
      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.byStatus.pending).toBeGreaterThanOrEqual(1);
      expect(stats.byStatus.completed).toBeGreaterThanOrEqual(1);
      expect(stats.byStatus.failed).toBeGreaterThanOrEqual(1);
    });

    it('should correctly count tasks by status', async () => {
      const stats = service.getQueueStats();

      expect(stats.byStatus).toHaveProperty('pending');
      expect(stats.byStatus).toHaveProperty('processing');
      expect(stats.byStatus).toHaveProperty('completed');
      expect(stats.byStatus).toHaveProperty('failed');
      expect(stats.byStatus).toHaveProperty('cancelled');
      expect(stats.byStatus).toHaveProperty('retrying');
    });

    it('should correctly count tasks by priority', async () => {
      const stats = service.getQueueStats();

      expect(stats.byPriority).toHaveProperty('low');
      expect(stats.byPriority).toHaveProperty('normal');
      expect(stats.byPriority).toHaveProperty('high');
      expect(stats.byPriority).toHaveProperty('critical');
    });
  });
});
