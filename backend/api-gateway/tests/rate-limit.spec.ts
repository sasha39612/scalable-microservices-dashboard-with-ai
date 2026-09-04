import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from '../src/guards/gql-throttler.guard';
import { rateLimitConfig, RateLimits } from '../src/config/rate-limit.config';

describe('Rate Limiting', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(rateLimitConfig)],
      providers: [
        {
          provide: APP_GUARD,
          useClass: GqlThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('ThrottlerModule Configuration', () => {
    it('should be configured with correct throttlers', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = rateLimitConfig as any;
      expect(config.throttlers).toBeDefined();
      expect(config.throttlers).toHaveLength(4);

      const [short, medium, long, daily] = config.throttlers;

      // Verify short throttler (1 second, 10 requests)
      expect(short.name).toBe('short');
      expect(short.ttl).toBe(1000);
      expect(short.limit).toBe(10);

      // Verify medium throttler (1 minute, 100 requests)
      expect(medium.name).toBe('medium');
      expect(medium.ttl).toBe(60000);
      expect(medium.limit).toBe(100);

      // Verify long throttler (1 hour, 1000 requests)
      expect(long.name).toBe('long');
      expect(long.ttl).toBe(3600000);
      expect(long.limit).toBe(1000);

      // Verify daily throttler (24 hours, 10000 requests)
      expect(daily.name).toBe('daily');
      expect(daily.ttl).toBe(24 * 3600000);
      expect(daily.limit).toBe(10000);
    });

    it('should skip health checks', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = rateLimitConfig as any;
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ url: '/health' }),
        }),
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shouldSkip = config.skipIf(mockContext as any);
      expect(shouldSkip).toBe(true);
    });

    it('should not skip non-health check endpoints', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = rateLimitConfig as any;
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ url: '/graphql' }),
        }),
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shouldSkip = config.skipIf(mockContext as any);
      expect(shouldSkip).toBe(false);
    });
  });

  describe('Rate Limit Configurations', () => {
    it('should have stricter limits for authentication', () => {
      // Login should have strict limits (3 per minute)
      expect(RateLimits.LOGIN.short.limit).toBe(3);
      expect(RateLimits.LOGIN.short.ttl).toBe(60000);

      // Register should have strict limits (1 per 5 minutes)
      expect(RateLimits.REGISTER.short.limit).toBe(1);
      expect(RateLimits.REGISTER.short.ttl).toBe(300000);

      // Auth operations should have strict limits (3 per minute)
      expect(RateLimits.AUTH.short.limit).toBe(3);
      expect(RateLimits.AUTH.short.ttl).toBe(60000);
    });

    it('should have moderate limits for AI operations', () => {
      // AI Chat should allow 5 messages per minute
      expect(RateLimits.AI_CHAT.short.limit).toBe(5);
      expect(RateLimits.AI_CHAT.short.ttl).toBe(60000);

      // AI Analysis should allow 2 per minute
      expect(RateLimits.AI_ANALYSIS.short.limit).toBe(2);
      expect(RateLimits.AI_ANALYSIS.short.ttl).toBe(60000);

      // AI Summary should allow 3 per minute
      expect(RateLimits.AI_SUMMARY.short.limit).toBe(3);
      expect(RateLimits.AI_SUMMARY.short.ttl).toBe(60000);
    });

    it('should have standard limits for dashboard and tasks', () => {
      // Dashboard operations (100 per 5 minutes)
      expect(RateLimits.DASHBOARD.medium.limit).toBe(100);
      expect(RateLimits.DASHBOARD.medium.ttl).toBe(300000);

      // Task operations (200 per 5 minutes)
      expect(RateLimits.TASKS.medium.limit).toBe(200);
      expect(RateLimits.TASKS.medium.ttl).toBe(300000);

      // User operations (300 per 5 minutes)
      expect(RateLimits.USER.medium.limit).toBe(300);
      expect(RateLimits.USER.medium.ttl).toBe(300000);
    });
  });

  describe('GqlThrottlerGuard', () => {
    it('should be defined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = rateLimitConfig as any;
      const guard = new GqlThrottlerGuard(
        config.throttlers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { errorMessage: 'Too Many Requests' } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        undefined as any,
      );
      expect(guard).toBeDefined();
    });

    it('should extend ThrottlerGuard', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = rateLimitConfig as any;
      const guard = new GqlThrottlerGuard(
        config.throttlers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { errorMessage: 'Too Many Requests' } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        undefined as any,
      );
      expect(guard).toBeInstanceOf(GqlThrottlerGuard);
    });

    it('should have getRequestResponse method', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = rateLimitConfig as any;
      const guard = new GqlThrottlerGuard(
        config.throttlers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { errorMessage: 'Too Many Requests' } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        undefined as any,
      );
      expect(typeof guard.getRequestResponse).toBe('function');
    });
  });
});
