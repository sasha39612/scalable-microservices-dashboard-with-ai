import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../src/health.controller';
import { WorkerClient } from '../../src/services/worker.client';
import { AIClient } from '../../src/services/ai.client';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let workerClient: jest.Mocked<WorkerClient>;
  let aiClient: jest.Mocked<AIClient>;

  beforeEach(async () => {
    const mockWorkerClient = {
      healthCheck: jest.fn(),
    };

    const mockAIClient = {
      healthCheck: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: WorkerClient,
          useValue: mockWorkerClient,
        },
        {
          provide: AIClient,
          useValue: mockAIClient,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    workerClient = module.get(WorkerClient);
    aiClient = module.get(AIClient);
  });

  describe('check', () => {
    it('should return basic health status', () => {
      const result = controller.check();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detailedCheck', () => {
    it('should return healthy status when all services are up', async () => {
      const workerHealth = {
        status: 'healthy',
        timestamp: new Date(),
      };

      const aiHealth = {
        status: 'healthy',
        timestamp: new Date(),
        models: ['gpt-3.5-turbo'],
      };

      workerClient.healthCheck.mockResolvedValue(workerHealth);
      aiClient.healthCheck.mockResolvedValue(aiHealth);

      const result = await controller.detailedCheck();

      expect(result.status).toBe('healthy');
      expect(result.services.apiGateway.status).toBe('healthy');
      expect(result.services.workerService.status).toBe('healthy');
      expect(result.services.aiService.status).toBe('healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
    });

    it('should return degraded status when one service is down', async () => {
      const workerHealth = {
        status: 'healthy',
        timestamp: new Date(),
      };

      workerClient.healthCheck.mockResolvedValue(workerHealth);
      aiClient.healthCheck.mockRejectedValue(
        new HttpException('AI Service unavailable', HttpStatus.SERVICE_UNAVAILABLE)
      );

      const result = await controller.detailedCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.services.apiGateway.status).toBe('healthy');
      expect(result.services.workerService.status).toBe('healthy');
      expect(result.services.aiService.status).toBe('unhealthy');
      expect(result.services.aiService.message).toContain('unavailable');
    });

    it('should return unhealthy status when multiple services are down', async () => {
      workerClient.healthCheck.mockRejectedValue(
        new HttpException('Worker Service unavailable', HttpStatus.SERVICE_UNAVAILABLE)
      );
      aiClient.healthCheck.mockRejectedValue(
        new HttpException('AI Service unavailable', HttpStatus.SERVICE_UNAVAILABLE)
      );

      const result = await controller.detailedCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.services.workerService.status).toBe('unhealthy');
      expect(result.services.aiService.status).toBe('unhealthy');
    });

    it('should handle generic errors from services', async () => {
      workerClient.healthCheck.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
      });
      aiClient.healthCheck.mockRejectedValue(new Error('Connection timeout'));

      const result = await controller.detailedCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.services.aiService.status).toBe('unhealthy');
      expect(result.services.aiService.message).toBe('Connection timeout');
    });
  });
});
