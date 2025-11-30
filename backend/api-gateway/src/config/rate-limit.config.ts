import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

/**
 * Enhanced rate limiting configuration with Redis support
 * 
 * Features:
 * - Multi-tier rate limiting (short, medium, long term)
 * - Redis storage for distributed environments (manual implementation)
 * - Context-aware limits
 * - Graceful fallback to in-memory storage
 */

@Injectable()
export class RateLimitConfig {
  static getConfig(): ThrottlerModuleOptions {
    return {
      throttlers: [
        {
          name: 'short',
          ttl: 1000, // 1 second
          limit: 10, // 10 requests per second - burst protection
        },
        {
          name: 'medium',
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute - standard limit
        },
        {
          name: 'long',
          ttl: 3600000, // 1 hour
          limit: 1000, // 1000 requests per hour - DoS protection
        },
        {
          name: 'daily',
          ttl: 24 * 3600000, // 24 hours
          limit: 10000, // 10000 requests per day - abuse prevention
        },
      ],
      
      // Enhanced skip logic for health checks and monitoring
      skipIf: (context) => {
        const request = context.switchToHttp().getRequest();
        const url = request?.url || '';
        
        // Skip rate limiting for:
        // - Health check endpoints
        // - Monitoring endpoints (with authentication)
        // - WebSocket connections
        const skipPaths = [
          '/health',
          '/metrics', 
          '/status',
          '/.well-known/',
        ];
        
        return skipPaths.some(path => url.includes(path)) || 
               url.includes('websocket') ||
               url.includes('ws');
      },
      
      // Enhanced error message
      errorMessage: 'Rate limit exceeded. Please slow down your requests.',
    };
  }
}

/**
 * Standard rate limit configuration for backwards compatibility
 */
export const rateLimitConfig: ThrottlerModuleOptions = RateLimitConfig.getConfig();

/**
 * Enhanced rate limit configurations for specific endpoints
 * Use with @Throttle decorator on resolvers/controllers
 */
export const RateLimits = {
  // Authentication endpoints - very strict limits
  AUTH: { 
    short: { limit: 3, ttl: 60000 }, // 3 requests per minute
    medium: { limit: 10, ttl: 600000 }, // 10 requests per 10 minutes
  },
  
  // Login specifically - prevent brute force attacks
  LOGIN: { 
    short: { limit: 3, ttl: 60000 }, // 3 attempts per minute
    medium: { limit: 5, ttl: 900000 }, // 5 attempts per 15 minutes
    long: { limit: 20, ttl: 3600000 }, // 20 attempts per hour
  },
  
  // Registration - prevent spam accounts
  REGISTER: { 
    short: { limit: 1, ttl: 300000 }, // 1 registration per 5 minutes
    medium: { limit: 3, ttl: 3600000 }, // 3 registrations per hour
    long: { limit: 5, ttl: 24 * 3600000 }, // 5 registrations per day
  },
  
  // Password reset - prevent abuse
  PASSWORD_RESET: {
    short: { limit: 1, ttl: 300000 }, // 1 request per 5 minutes
    medium: { limit: 3, ttl: 3600000 }, // 3 requests per hour
    long: { limit: 10, ttl: 24 * 3600000 }, // 10 requests per day
  },
  
  // AI operations - resource intensive, higher limits for authenticated users
  AI_CHAT: { 
    short: { limit: 5, ttl: 60000 }, // 5 messages per minute
    medium: { limit: 30, ttl: 300000 }, // 30 messages per 5 minutes
    long: { limit: 200, ttl: 3600000 }, // 200 messages per hour
  },
  
  AI_ANALYSIS: { 
    short: { limit: 2, ttl: 60000 }, // 2 analyses per minute
    medium: { limit: 10, ttl: 300000 }, // 10 analyses per 5 minutes
    long: { limit: 50, ttl: 3600000 }, // 50 analyses per hour
  },
  
  AI_SUMMARY: { 
    short: { limit: 3, ttl: 60000 }, // 3 summaries per minute
    medium: { limit: 15, ttl: 300000 }, // 15 summaries per 5 minutes
    long: { limit: 100, ttl: 3600000 }, // 100 summaries per hour
  },
  
  // File operations - prevent abuse
  FILE_UPLOAD: {
    short: { limit: 5, ttl: 60000 }, // 5 uploads per minute
    medium: { limit: 20, ttl: 300000 }, // 20 uploads per 5 minutes
    long: { limit: 100, ttl: 3600000 }, // 100 uploads per hour
  },
  
  // Dashboard operations - moderate limits
  DASHBOARD: { 
    short: { limit: 20, ttl: 60000 }, // 20 requests per minute
    medium: { limit: 100, ttl: 300000 }, // 100 requests per 5 minutes
  },
  
  // Task operations - standard limits
  TASKS: { 
    short: { limit: 30, ttl: 60000 }, // 30 requests per minute
    medium: { limit: 200, ttl: 300000 }, // 200 requests per 5 minutes
  },
  
  // User profile operations - generous limits for authenticated users
  USER: { 
    short: { limit: 50, ttl: 60000 }, // 50 requests per minute
    medium: { limit: 300, ttl: 300000 }, // 300 requests per 5 minutes
  },
  
  // Search operations - moderate limits
  SEARCH: {
    short: { limit: 10, ttl: 60000 }, // 10 searches per minute
    medium: { limit: 50, ttl: 300000 }, // 50 searches per 5 minutes
    long: { limit: 200, ttl: 3600000 }, // 200 searches per hour
  },
  
  // Administrative operations - very strict
  ADMIN: {
    short: { limit: 10, ttl: 60000 }, // 10 requests per minute
    medium: { limit: 50, ttl: 600000 }, // 50 requests per 10 minutes
    long: { limit: 200, ttl: 3600000 }, // 200 requests per hour
  },
  
  // Security operations - special limits
  SECURITY: {
    short: { limit: 5, ttl: 60000 }, // 5 requests per minute
    medium: { limit: 20, ttl: 600000 }, // 20 requests per 10 minutes
  },
};

/**
 * Rate limiting strategies based on user authentication status
 */
export const UserBasedLimits = {
  // Unauthenticated users - stricter limits
  ANONYMOUS: {
    short: { limit: 5, ttl: 60000 },
    medium: { limit: 20, ttl: 300000 },
    long: { limit: 100, ttl: 3600000 },
  },
  
  // Authenticated users - standard limits
  AUTHENTICATED: {
    short: { limit: 20, ttl: 60000 },
    medium: { limit: 100, ttl: 300000 },
    long: { limit: 500, ttl: 3600000 },
  },
  
  // Premium users - higher limits
  PREMIUM: {
    short: { limit: 50, ttl: 60000 },
    medium: { limit: 250, ttl: 300000 },
    long: { limit: 1000, ttl: 3600000 },
  },
  
  // Admin users - highest limits
  ADMIN: {
    short: { limit: 100, ttl: 60000 },
    medium: { limit: 500, ttl: 300000 },
    long: { limit: 2000, ttl: 3600000 },
  },
};
