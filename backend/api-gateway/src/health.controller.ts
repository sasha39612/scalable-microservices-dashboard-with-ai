import { Controller, Get } from '@nestjs/common';
import { WorkerClient } from './services/worker.client';
import { AIClient } from './services/ai.client';
import { CacheService } from './services/cache.service';
import { Public } from './modules/auth/decorators/public.decorator';

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  timestamp?: Date;
  details?: Record<string, unknown>;
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  services: {
    apiGateway: ServiceHealth;
    workerService: ServiceHealth;
    aiService: ServiceHealth;
    cache: ServiceHealth;
  };
  uptime: number;
}

@Controller('health')
export class HealthController {
  private readonly startTime: Date;

  constructor(
    private readonly workerClient: WorkerClient,
    private readonly aiClient: AIClient,
    private readonly cacheService: CacheService,
  ) {
    this.startTime = new Date();
  }

  /**
   * Basic health check endpoint
   */
  @Public()
  @Get()
  check() {
    return {
      status: 'healthy',
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Comprehensive health check including all services
   */
  @Public()
  @Get('detailed')
  async detailedCheck(): Promise<HealthCheckResponse> {
    const services = {
      apiGateway: await this.checkApiGateway(),
      workerService: await this.checkWorkerService(),
      aiService: await this.checkAIService(),
      cache: await this.checkCacheService(),
    };

    // Determine overall status
    const statuses = Object.values(services).map((s) => s.status);
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      services,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Check API Gateway health
   */
  private async checkApiGateway(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      message: 'API Gateway is running',
      timestamp: new Date(),
      details: {
        uptime: Date.now() - this.startTime.getTime(),
        version: process.env.npm_package_version || '1.0.0',
      },
    };
  }

  /**
   * Check Worker Service health
   */
  private async checkWorkerService(): Promise<ServiceHealth> {
    try {
      const health = await this.workerClient.healthCheck();
      return {
        status: 'healthy',
        message: 'Worker Service is operational',
        timestamp: health.timestamp,
        details: health,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Worker Service unavailable',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check AI Service health
   */
  private async checkAIService(): Promise<ServiceHealth> {
    try {
      const health = await this.aiClient.healthCheck();
      return {
        status: 'healthy',
        message: 'AI Service is operational',
        timestamp: health.timestamp,
        details: health,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'AI Service unavailable',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check Cache Service health
   */
  private async checkCacheService(): Promise<ServiceHealth> {
    try {
      const stats = this.cacheService.getCacheStats();
      
      // Test cache connectivity
      const testKey = 'health-check-test';
      const testValue = { timestamp: Date.now() };
      const setResult = await this.cacheService.set(testKey, testValue, 10);
      const getResult = await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);

      const isWorking = setResult && getResult !== null;
      
      return {
        status: stats.redisConnected ? 'healthy' : (isWorking ? 'degraded' : 'unhealthy'),
        message: stats.redisConnected 
          ? 'Cache service is operational with Redis'
          : (isWorking ? 'Cache service running on memory fallback' : 'Cache service unavailable'),
        timestamp: new Date(),
        details: {
          ...stats,
          testPassed: isWorking,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Cache service unavailable',
        timestamp: new Date(),
      };
    }
  }
}