import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { TasksController } from '../../src/controllers/tasks.controller';
import { Job, JobStatus, JobPriority } from '../../../common/src/types/common';

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should initialize with sample tasks', () => {
      const tasks = controller['tasks'];
      expect(tasks.size).toBeGreaterThan(0);
    });
  });

  describe('POST /tasks - createTask', () => {
    it('should create a new task with default priority', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com', subject: 'Test' },
      };

      const result = await controller.createTask(createTaskDto);

      expect(result).toBeDefined();
      expect(result.type).toBe('email');
      expect(result.status).toBe(JobStatus.Pending);
      expect(result.priority).toBe(JobPriority.Normal);
      expect(result.attempts).toBe(0);
      expect(result.maxAttempts).toBe(3);
      expect(result.createdAt).toBeDefined();
      expect(result.payload).toEqual(createTaskDto.payload);
    });

    it('should create a new task with custom priority', async () => {
      const createTaskDto = {
        type: 'data-sync',
        payload: { source: 'db-a', target: 'db-b' },
        priority: JobPriority.High,
      };

      const result = await controller.createTask(createTaskDto);

      expect(result.priority).toBe(JobPriority.High);
      expect(result.type).toBe('data-sync');
    });

    it('should create task with unique ID', async () => {
      const createTaskDto1 = {
        type: 'task1',
        payload: { data: '1' },
      };

      const createTaskDto2 = {
        type: 'task2',
        payload: { data: '2' },
      };

      const result1 = await controller.createTask(createTaskDto1);
      const result2 = await controller.createTask(createTaskDto2);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should add log entry when task is created', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
      };

      const result = await controller.createTask(createTaskDto);
      const logs = await controller.getTaskLogs(result.id);

      expect(logs.logs.length).toBeGreaterThan(0);
      expect(logs.logs[0].message).toContain('created');
    });
  });

  describe('GET /tasks - getTasks', () => {
    it('should return all tasks with default pagination', async () => {
      const result = await controller.getTasks({});

      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('offset');
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should filter tasks by status', async () => {
      const result = await controller.getTasks({
        status: JobStatus.Completed,
      });

      result.tasks.forEach(task => {
        expect(task.status).toBe(JobStatus.Completed);
      });
    });

    it('should filter tasks by type', async () => {
      const result = await controller.getTasks({
        type: 'email',
      });

      result.tasks.forEach(task => {
        expect(task.type).toBe('email');
      });
    });

    it('should filter tasks by priority', async () => {
      const result = await controller.getTasks({
        priority: JobPriority.High,
      });

      result.tasks.forEach(task => {
        expect(task.priority).toBe(JobPriority.High);
      });
    });

    it('should apply custom pagination', async () => {
      const limit = 2;
      const offset = 1;
      const result = await controller.getTasks({ limit, offset });

      expect(result.limit).toBe(limit);
      expect(result.offset).toBe(offset);
      expect(result.tasks.length).toBeLessThanOrEqual(limit);
    });

    it('should sort tasks by creation date (newest first)', async () => {
      const result = await controller.getTasks({});

      if (result.tasks.length > 1) {
        for (let i = 0; i < result.tasks.length - 1; i++) {
          const currentTime = result.tasks[i].createdAt.getTime();
          const nextTime = result.tasks[i + 1].createdAt.getTime();
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }
      }
    });

    it('should apply multiple filters simultaneously', async () => {
      const result = await controller.getTasks({
        status: JobStatus.Failed,
        priority: JobPriority.Low,
        limit: 10,
      });

      result.tasks.forEach(task => {
        expect(task.status).toBe(JobStatus.Failed);
        expect(task.priority).toBe(JobPriority.Low);
      });
      expect(result.tasks.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /tasks/:id - getTaskById', () => {
    it('should return task by ID', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
      };

      const createdTask = await controller.createTask(createTaskDto);
      const result = await controller.getTaskById(createdTask.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdTask.id);
      expect(result.type).toBe('email');
    });

    it('should throw HttpException for non-existent task', async () => {
      await expect(controller.getTaskById('non-existent-id')).rejects.toThrow(
        HttpException,
      );
      
      try {
        await controller.getTaskById('non-existent-id');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should return task with all properties', async () => {
      const createTaskDto = {
        type: 'cleanup',
        payload: { target: 'temp-files' },
        priority: JobPriority.Low,
      };

      const createdTask = await controller.createTask(createTaskDto);
      const result = await controller.getTaskById(createdTask.id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('payload');
      expect(result).toHaveProperty('attempts');
      expect(result).toHaveProperty('maxAttempts');
      expect(result).toHaveProperty('createdAt');
    });
  });

  describe('POST /tasks/:id/retry - retryTask', () => {
    it('should retry a failed task', async () => {
      // Create a failed task manually
      const taskId = '999';
      const failedTask: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Connection timeout',
      };
      
      controller['tasks'].set(taskId, failedTask);

      const result = await controller.retryTask(taskId, {});

      expect(result.status).toBe(JobStatus.Pending);
      expect(result.error).toBeUndefined();
      expect(result.attempts).toBe(1); // Should maintain attempt count
    });

    it('should retry with reset attempts', async () => {
      const taskId = '998';
      const failedTask: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 2,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Connection timeout',
      };
      
      controller['tasks'].set(taskId, failedTask);

      const result = await controller.retryTask(taskId, { resetAttempts: true });

      expect(result.status).toBe(JobStatus.Pending);
      expect(result.attempts).toBe(0); // Should reset attempts
    });

    it('should retry a cancelled task', async () => {
      const taskId = '997';
      const cancelledTask: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Cancelled,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
      };
      
      controller['tasks'].set(taskId, cancelledTask);

      const result = await controller.retryTask(taskId, {});

      expect(result.status).toBe(JobStatus.Pending);
    });

    it('should throw HttpException for non-existent task', async () => {
      await expect(
        controller.retryTask('non-existent-id', {}),
      ).rejects.toThrow(HttpException);
    });

    it('should throw BadRequestException for completed task', async () => {
      const taskId = '996';
      const completedTask: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Completed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        completedAt: new Date(),
      };
      
      controller['tasks'].set(taskId, completedTask);

      await expect(controller.retryTask(taskId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for pending task', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
      };

      const createdTask = await controller.createTask(createTaskDto);

      await expect(controller.retryTask(createdTask.id, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should add log entry when task is retried', async () => {
      const taskId = '995';
      const failedTask: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Connection timeout',
      };
      
      controller['tasks'].set(taskId, failedTask);
      controller['taskLogs'].set(taskId, []);

      await controller.retryTask(taskId, {});
      const logs = await controller.getTaskLogs(taskId);

      expect(logs.logs.some(log => log.message.includes('retried'))).toBe(true);
    });
  });

  describe('POST /tasks/:id/cancel - cancelTask', () => {
    it('should cancel a pending task', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
      };

      const createdTask = await controller.createTask(createTaskDto);
      const result = await controller.cancelTask(createdTask.id);

      expect(result.status).toBe(JobStatus.Cancelled);
      expect(result.completedAt).toBeDefined();
    });

    it('should cancel a processing task', async () => {
      const taskId = '994';
      const processingTask: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Processing,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        startedAt: new Date(),
      };
      
      controller['tasks'].set(taskId, processingTask);

      const result = await controller.cancelTask(taskId);

      expect(result.status).toBe(JobStatus.Cancelled);
    });

    it('should throw HttpException for non-existent task', async () => {
      await expect(controller.cancelTask('non-existent-id')).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw BadRequestException for completed task', async () => {
      const taskId = '993';
      const completedTask: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Completed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        completedAt: new Date(),
      };
      
      controller['tasks'].set(taskId, completedTask);

      await expect(controller.cancelTask(taskId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for failed task', async () => {
      const taskId = '992';
      const failedTask: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Failed,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 3,
        maxAttempts: 3,
        createdAt: new Date(),
        error: 'Failed',
      };
      
      controller['tasks'].set(taskId, failedTask);

      await expect(controller.cancelTask(taskId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should add log entry when task is cancelled', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
      };

      const createdTask = await controller.createTask(createTaskDto);
      await controller.cancelTask(createdTask.id);
      const logs = await controller.getTaskLogs(createdTask.id);

      expect(logs.logs.some(log => log.message.includes('cancelled'))).toBe(true);
    });
  });

  describe('GET /tasks/:id/logs - getTaskLogs', () => {
    it('should return logs for a task', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
      };

      const createdTask = await controller.createTask(createTaskDto);
      const result = await controller.getTaskLogs(createdTask.id);

      expect(result).toHaveProperty('taskId', createdTask.id);
      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.logs)).toBe(true);
    });

    it('should return paginated logs', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
      };

      const createdTask = await controller.createTask(createTaskDto);
      
      // Add more log entries
      controller['addLog'](createdTask.id, {
        timestamp: new Date(),
        level: 'info',
        message: 'Additional log 1',
      });
      controller['addLog'](createdTask.id, {
        timestamp: new Date(),
        level: 'info',
        message: 'Additional log 2',
      });

      const result = await controller.getTaskLogs(createdTask.id, 2, 0);

      expect(result.logs.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(result.logs.length);
    });

    it('should apply offset correctly', async () => {
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
      };

      const createdTask = await controller.createTask(createTaskDto);
      
      // Add more log entries
      for (let i = 0; i < 5; i++) {
        controller['addLog'](createdTask.id, {
          timestamp: new Date(),
          level: 'info',
          message: `Log entry ${i}`,
        });
      }

      const resultOffset0 = await controller.getTaskLogs(createdTask.id, 2, 0);
      const resultOffset2 = await controller.getTaskLogs(createdTask.id, 2, 2);

      expect(resultOffset0.logs[0]).not.toEqual(resultOffset2.logs[0]);
    });

    it('should throw HttpException for non-existent task', async () => {
      await expect(
        controller.getTaskLogs('non-existent-id'),
      ).rejects.toThrow(HttpException);
    });

    it('should return empty logs array for task without logs', async () => {
      const taskId = '991';
      const task: Job = {
        id: taskId,
        type: 'email',
        status: JobStatus.Pending,
        priority: JobPriority.Normal,
        payload: { to: 'test@example.com' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      };
      
      controller['tasks'].set(taskId, task);

      const result = await controller.getTaskLogs(taskId);

      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('GET /tasks/stats/summary - getTaskStats', () => {
    it('should return task statistics', async () => {
      const result = await controller.getTaskStats();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('byPriority');
    });

    it('should have correct status breakdown', async () => {
      const result = await controller.getTaskStats();

      expect(result.byStatus).toHaveProperty('pending');
      expect(result.byStatus).toHaveProperty('processing');
      expect(result.byStatus).toHaveProperty('completed');
      expect(result.byStatus).toHaveProperty('failed');
      expect(result.byStatus).toHaveProperty('cancelled');
      expect(result.byStatus).toHaveProperty('retrying');

      Object.values(result.byStatus).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have correct priority breakdown', async () => {
      const result = await controller.getTaskStats();

      expect(result.byPriority).toHaveProperty('low');
      expect(result.byPriority).toHaveProperty('normal');
      expect(result.byPriority).toHaveProperty('high');
      expect(result.byPriority).toHaveProperty('critical');

      Object.values(result.byPriority).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('should reflect changes when tasks are added', async () => {
      const statsBefore = await controller.getTaskStats();
      
      const createTaskDto = {
        type: 'email',
        payload: { to: 'test@example.com' },
        priority: JobPriority.High,
      };
      await controller.createTask(createTaskDto);

      const statsAfter = await controller.getTaskStats();

      expect(statsAfter.total).toBe(statsBefore.total + 1);
      expect(statsAfter.byStatus.pending).toBe(statsBefore.byStatus.pending + 1);
      expect(statsAfter.byPriority.high).toBe(statsBefore.byPriority.high + 1);
    });

    it('should have total equal to sum of all statuses', async () => {
      const result = await controller.getTaskStats();
      
      const sumByStatus = Object.values(result.byStatus).reduce(
        (acc, count) => acc + count,
        0,
      );

      expect(result.total).toBe(sumByStatus);
    });

    it('should have total equal to sum of all priorities', async () => {
      const result = await controller.getTaskStats();
      
      const sumByPriority = Object.values(result.byPriority).reduce(
        (acc, count) => acc + count,
        0,
      );

      expect(result.total).toBe(sumByPriority);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid task creation', async () => {
      const taskPromises = [];
      
      for (let i = 0; i < 10; i++) {
        taskPromises.push(
          controller.createTask({
            type: 'stress-test',
            payload: { index: i },
          }),
        );
      }

      const tasks = await Promise.all(taskPromises);

      expect(tasks.length).toBe(10);
      
      // All tasks should have unique IDs
      const ids = tasks.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle large payload data', async () => {
      const largePayload = {
        data: Array(1000).fill('x').join(''),
        nested: {
          deep: {
            property: 'value',
          },
        },
      };

      const result = await controller.createTask({
        type: 'large-data',
        payload: largePayload,
      });

      expect(result.payload).toEqual(largePayload);
    });
  });
});
