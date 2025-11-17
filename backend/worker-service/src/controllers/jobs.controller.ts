import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';

/**
 * Job status enum
 */
export enum JobScheduleStatus {
  Active = 'active',
  Paused = 'paused',
  Failed = 'failed',
}

/**
 * Scheduled job interface
 */
export interface ScheduledJob {
  id: string;
  name: string;
  type: string;
  schedule: string;
  payload: Record<string, unknown>;
  status: JobScheduleStatus;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create job request body
 */
interface CreateJobDto {
  name: string;
  type: string;
  schedule: string;
  payload: Record<string, unknown>;
}

/**
 * Jobs Controller
 * Handles REST endpoints for scheduled job management
 */
@Controller('jobs')
export class JobsController {
  // In-memory job storage (replace with actual database/scheduler integration)
  private jobs: Map<string, ScheduledJob> = new Map();

  constructor() {
    // Initialize with some sample data for demonstration
    this.initializeSampleJobs();
  }

  /**
   * POST /jobs
   * Create a new scheduled job
   */
  @Post()
  async createJob(@Body() createJobDto: CreateJobDto): Promise<ScheduledJob> {
    const jobId = (this.jobs.size + 1).toString();
    
    const newJob: ScheduledJob = {
      id: jobId,
      name: createJobDto.name,
      type: createJobDto.type,
      schedule: createJobDto.schedule,
      payload: createJobDto.payload,
      status: JobScheduleStatus.Active,
      createdAt: new Date(),
      updatedAt: new Date(),
      nextRun: this.calculateNextRun(),
    };

    this.jobs.set(jobId, newJob);

    return newJob;
  }

  /**
   * GET /jobs
   * Fetch all scheduled jobs
   */
  @Get()
  async getJobs(): Promise<ScheduledJob[]> {
    return Array.from(this.jobs.values());
  }

  /**
   * GET /jobs/:id
   * Fetch a specific job by ID
   */
  @Get(':id')
  async getJobById(@Param('id') id: string): Promise<ScheduledJob> {
    const job = this.jobs.get(id);

    if (!job) {
      throw new HttpException(
        `Job with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return job;
  }

  /**
   * POST /jobs/:id/pause
   * Pause a scheduled job
   */
  @Post(':id/pause')
  async pauseJob(@Param('id') id: string): Promise<ScheduledJob> {
    const job = this.jobs.get(id);

    if (!job) {
      throw new HttpException(
        `Job with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (job.status === JobScheduleStatus.Paused) {
      throw new BadRequestException('Job is already paused');
    }

    const updatedJob: ScheduledJob = {
      ...job,
      status: JobScheduleStatus.Paused,
      updatedAt: new Date(),
    };

    this.jobs.set(id, updatedJob);

    return updatedJob;
  }

  /**
   * POST /jobs/:id/resume
   * Resume a paused job
   */
  @Post(':id/resume')
  async resumeJob(@Param('id') id: string): Promise<ScheduledJob> {
    const job = this.jobs.get(id);

    if (!job) {
      throw new HttpException(
        `Job with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (job.status !== JobScheduleStatus.Paused) {
      throw new BadRequestException('Job is not paused');
    }

    const updatedJob: ScheduledJob = {
      ...job,
      status: JobScheduleStatus.Active,
      updatedAt: new Date(),
      nextRun: this.calculateNextRun(),
    };

    this.jobs.set(id, updatedJob);

    return updatedJob;
  }

  /**
   * DELETE /jobs/:id
   * Delete a scheduled job
   */
  @Delete(':id')
  async deleteJob(@Param('id') id: string): Promise<{ message: string }> {
    const job = this.jobs.get(id);

    if (!job) {
      throw new HttpException(
        `Job with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    this.jobs.delete(id);

    return { message: `Job ${id} deleted successfully` };
  }

  /**
   * Helper method to calculate next run time based on schedule
   * This is a simple implementation - in production, use a proper cron parser
   */
  private calculateNextRun(): Date {
    // Simple implementation: default to 1 hour from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now;
  }

  /**
   * Initialize sample jobs for demonstration
   */
  private initializeSampleJobs(): void {
    const sampleJobs: ScheduledJob[] = [
      {
        id: '1',
        name: 'Daily Backup',
        type: 'backup',
        schedule: '0 0 * * *',
        payload: { target: 'database' },
        status: JobScheduleStatus.Active,
        lastRun: new Date(Date.now() - 86400000),
        nextRun: new Date(Date.now() + 86400000),
        createdAt: new Date(Date.now() - 604800000),
        updatedAt: new Date(Date.now() - 86400000),
      },
      {
        id: '2',
        name: 'Hourly Cleanup',
        type: 'cleanup',
        schedule: '0 * * * *',
        payload: { target: 'temp-files' },
        status: JobScheduleStatus.Active,
        lastRun: new Date(Date.now() - 3600000),
        nextRun: new Date(Date.now() + 1800000),
        createdAt: new Date(Date.now() - 2592000000),
        updatedAt: new Date(Date.now() - 3600000),
      },
      {
        id: '3',
        name: 'Weekly Report',
        type: 'report',
        schedule: '0 0 * * 1',
        payload: { recipients: ['admin@example.com'] },
        status: JobScheduleStatus.Paused,
        lastRun: new Date(Date.now() - 604800000),
        createdAt: new Date(Date.now() - 2592000000),
        updatedAt: new Date(Date.now() - 86400000),
      },
    ];

    sampleJobs.forEach((job) => {
      this.jobs.set(job.id, job);
    });
  }
}
