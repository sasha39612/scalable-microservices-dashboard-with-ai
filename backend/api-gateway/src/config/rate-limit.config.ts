import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Rate limiting configuration
 * 
 * Default limits:
 * - 100 requests per minute for general endpoints
 * - Stricter limits can be applied to specific resolvers using @Throttle decorator
 */
export const rateLimitConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'short',
      ttl: 1000, // 1 second
      limit: 10, // 10 requests per second
    },
    {
      name: 'medium',
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    },
    {
      name: 'long',
      ttl: 3600000, // 1 hour
      limit: 1000, // 1000 requests per hour
    },
  ],
  // Skip rate limiting for health checks
  skipIf: (context) => {
    const request = context.switchToHttp().getRequest();
    return request?.url === '/health';
  },
};

/**
 * Rate limit configurations for specific endpoints
 * Use with @Throttle decorator on resolvers
 */
export const RateLimits = {
  // Authentication endpoints - stricter limits
  AUTH: { short: { limit: 5, ttl: 60000 } }, // 5 requests per minute
  
  // Login specifically - prevent brute force
  LOGIN: { short: { limit: 3, ttl: 60000 } }, // 3 attempts per minute
  
  // Registration - prevent spam
  REGISTER: { short: { limit: 3, ttl: 300000 } }, // 3 registrations per 5 minutes
  
  // AI operations - resource intensive
  AI_CHAT: { short: { limit: 10, ttl: 60000 } }, // 10 messages per minute
  AI_ANALYSIS: { short: { limit: 5, ttl: 60000 } }, // 5 analyses per minute
  AI_SUMMARY: { short: { limit: 5, ttl: 60000 } }, // 5 summaries per minute
  
  // Dashboard operations - moderate limits
  DASHBOARD: { medium: { limit: 50, ttl: 60000 } }, // 50 requests per minute
  
  // Task operations - standard limits
  TASKS: { medium: { limit: 100, ttl: 60000 } }, // 100 requests per minute
  
  // User profile - standard limits
  USER: { medium: { limit: 100, ttl: 60000 } }, // 100 requests per minute
};
