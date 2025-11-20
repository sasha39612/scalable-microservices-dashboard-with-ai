import { Controller, Get } from '@nestjs/common';
import { Public } from './decorators/public.decorator';

interface HealthResponse {
  status: string;
  timestamp: Date;
  uptime: number;
  service: string;
  version: string;
  models?: string[];
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
      service: 'ai-service',
      version: process.env.npm_package_version || '1.0.0',
      models: ['gpt-3.5-turbo', 'text-davinci-003'],
    };
  }
}
