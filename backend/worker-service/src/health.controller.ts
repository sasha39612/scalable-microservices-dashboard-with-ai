import { Controller, Get } from '@nestjs/common';
import { Public } from './decorators/public.decorator';

interface HealthResponse {
  status: string;
  timestamp: Date;
  uptime: number;
  service: string;
  version: string;
  queues?: {
    pending: number;
    active: number;
    completed: number;
    failed: number;
  };
}

@Controller('health')
export class HealthController {
  private readonly startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  @Public()
  @Get()
  check(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      service: 'worker-service',
      version: process.env.npm_package_version || '1.0.0',
      queues: {
        pending: 0,
        active: 0,
        completed: 0,
        failed: 0,
      },
    };
  }
}
