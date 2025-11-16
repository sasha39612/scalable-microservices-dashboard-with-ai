import { Injectable } from '@nestjs/common';
import { WorkerClient } from '../../services/worker.client';
import { Task, Job, TasksResponse, CreateTaskInput, CreateJobInput, TaskFiltersInput, TaskStatus, JobStatus } from './tasks.model';

@Injectable()
export class TasksService {
  constructor(private readonly workerClient: WorkerClient) {}

  async createTask(input: CreateTaskInput): Promise<Task> {
    const task = await this.workerClient.createTask({
      type: input.type,
      payload: input.payload,
      priority: input.priority,
    });
    return {
      ...task,
      status: task.status as TaskStatus,
    };
  }

  async getTask(taskId: string): Promise<Task> {
    const task = await this.workerClient.getTask(taskId);
    return {
      ...task,
      status: task.status as TaskStatus,
    };
  }

  async getTasks(filters?: TaskFiltersInput): Promise<TasksResponse> {
    const result = await this.workerClient.getTasks(filters);
    return {
      ...result,
      tasks: result.tasks.map(task => ({
        ...task,
        status: task.status as TaskStatus,
      })),
    };
  }

  async cancelTask(taskId: string): Promise<boolean> {
    await this.workerClient.cancelTask(taskId);
    return true;
  }

  async createJob(input: CreateJobInput): Promise<Job> {
    const job = await this.workerClient.createJob({
      name: input.name,
      type: input.type,
      schedule: input.schedule,
      payload: input.payload,
    });
    return {
      ...job,
      status: job.status as JobStatus,
    };
  }

  async getJobs(): Promise<Job[]> {
    const jobs = await this.workerClient.getJobs();
    return jobs.map(job => ({
      ...job,
      status: job.status as JobStatus,
    }));
  }

  async getJob(jobId: string): Promise<Job> {
    const job = await this.workerClient.getJob(jobId);
    return {
      ...job,
      status: job.status as JobStatus,
    };
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
}
