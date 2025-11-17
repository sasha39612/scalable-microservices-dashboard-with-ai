import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface WorkerJob {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobDto {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  priority?: 'low' | 'normal' | 'high';
  retries?: number;
}

@Injectable()
export class WorkerClientService {
  private readonly logger = new Logger(WorkerClientService.name);
  private client: AxiosInstance | null = null;
  private workerServiceUrl: string;
  private isAvailable = false;

  constructor() {
    this.workerServiceUrl = process.env.WORKER_SERVICE_URL || 'http://localhost:4001';
    this.initializeClient();
  }

  private initializeClient(): void {
    if (!this.workerServiceUrl) {
      this.logger.warn('WORKER_SERVICE_URL not configured. Worker Service integration will be disabled.');
      return;
    }

    try {
      this.client = axios.create({
        baseURL: this.workerServiceUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add request interceptor for logging
      this.client.interceptors.request.use(
        (config) => {
          this.logger.debug(`Worker Service request: ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => {
          this.logger.error('Worker Service request error', error);
          return Promise.reject(error);
        },
      );

      // Add response interceptor for logging
      this.client.interceptors.response.use(
        (response) => {
          this.logger.debug(`Worker Service response: ${response.status} ${response.config.url}`);
          return response;
        },
        (error) => {
          const status = error.response?.status || 'unknown';
          this.logger.error(`Worker Service response error: ${status} ${error.config?.url}`);
          return Promise.reject(error);
        },
      );

      this.isAvailable = true;
      this.logger.log(`Worker Service client initialized: ${this.workerServiceUrl}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to initialize Worker Service client: ${err.message}`, err.stack);
      this.client = null;
    }
  }

  /**
   * Create a new async job in the Worker Service
   */
  async createJob(jobDto: CreateJobDto): Promise<WorkerJob | null> {
    if (!this.client) {
      this.logger.warn('Worker Service client not available, cannot create job');
      return null;
    }

    try {
      const response = await this.client.post('/api/tasks', {
        type: jobDto.type,
        payload: jobDto.payload,
        priority: jobDto.priority || 'normal',
        retries: jobDto.retries || 3,
      });

      this.logger.log(`Created worker job: ${response.data.id}`);
      return response.data;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create worker job: ${err.message}`, err.stack);
      return null;
    }
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<WorkerJob | null> {
    if (!this.client) {
      return null;
    }

    try {
      const response = await this.client.get(`/api/tasks/${jobId}`);
      return response.data;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get job status: ${err.message}`);
      return null;
    }
  }

  /**
   * Get job result (waits for completion if still processing)
   */
  async getJobResult(
    jobId: string,
    timeout: number = 60000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any | null> {
    if (!this.client) {
      return null;
    }

    const startTime = Date.now();
    const pollInterval = 1000; // Poll every 1 second

    try {
      while (Date.now() - startTime < timeout) {
        const job = await this.getJobStatus(jobId);
        
        if (!job) {
          this.logger.error(`Job ${jobId} not found`);
          return null;
        }

        if (job.status === 'completed') {
          this.logger.log(`Job ${jobId} completed successfully`);
          return job.result;
        }

        if (job.status === 'failed') {
          this.logger.error(`Job ${jobId} failed: ${job.error}`);
          return null;
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      this.logger.warn(`Job ${jobId} timed out after ${timeout}ms`);
      return null;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get job result: ${err.message}`);
      return null;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.delete(`/api/tasks/${jobId}`);
      this.logger.log(`Cancelled job: ${jobId}`);
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to cancel job: ${err.message}`);
      return false;
    }
  }

  /**
   * List jobs with optional filtering
   */
  async listJobs(filters?: {
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<WorkerJob[]> {
    if (!this.client) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await this.client.get(`/api/tasks?${params.toString()}`);
      return response.data;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to list jobs: ${err.message}`);
      return [];
    }
  }

  /**
   * Helper method to create an AI processing job
   */
  async createAIProcessingJob(payload: {
    type: 'chat' | 'insights';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
  }): Promise<string | null> {
    const job = await this.createJob({
      type: `ai_${payload.type}`,
      payload: payload.data,
      priority: 'normal',
      retries: 2,
    });

    return job?.id || null;
  }

  /**
   * Helper method to create a bulk insights job
   */
  async createBulkInsightsJob(payload: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    datasets: Array<{ type: string; data: any[] }>;
  }): Promise<string | null> {
    const job = await this.createJob({
      type: 'ai_bulk_insights',
      payload,
      priority: 'low',
      retries: 1,
    });

    return job?.id || null;
  }

  /**
   * Check Worker Service health
   */
  async checkHealth(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const response = await this.client.get('/health');
      this.isAvailable = response.status === 200;
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      this.logger.error('Worker Service health check failed');
      return false;
    }
  }

  /**
   * Get Worker Service stats
   */
  async getStats(): Promise<{
    available: boolean;
    url: string;
    pendingJobs?: number;
    processingJobs?: number;
  }> {
    const stats = {
      available: this.isAvailable,
      url: this.workerServiceUrl,
    };

    if (!this.client || !this.isAvailable) {
      return stats;
    }

    try {
      const [pending, processing] = await Promise.all([
        this.listJobs({ status: 'pending', limit: 1000 }),
        this.listJobs({ status: 'processing', limit: 1000 }),
      ]);

      return {
        ...stats,
        pendingJobs: pending.length,
        processingJobs: processing.length,
      };
    } catch {
      return stats;
    }
  }

  /**
   * Check if Worker Service is available
   */
  isWorkerAvailable(): boolean {
    return this.isAvailable && this.client !== null;
  }
}
