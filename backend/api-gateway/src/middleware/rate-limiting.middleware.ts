/* eslint-disable @typescript-eslint/no-explicit-any */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

/**
 * Enhanced Rate Limiting Middleware
 * Provides multiple layers of rate limiting and request throttling
 */
@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private readonly globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests from this IP',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Redis store would be configured here for distributed environments
    // store: new RedisStore({...})
  });

  private readonly authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit auth attempts
    skipSuccessfulRequests: true,
    message: {
      error: 'Too many authentication attempts',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
  });

  private readonly slowDownMiddleware = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // Allow 100 requests per windowMs without delay
    delayMs: (used: number) => {
      return (used - 100) * 100; // Add 100ms delay per request after 100 requests
    },
    maxDelayMs: 5000, // Max delay of 5 seconds
  });

  use(req: Request, res: Response, next: NextFunction): void {
    // Apply slow down to all requests
    this.slowDownMiddleware(req, res, (slowDownErr?: any) => {
      if (slowDownErr) return next(slowDownErr);

      // Apply specific rate limiting based on endpoint
      if (this.isAuthEndpoint(req)) {
        this.authRateLimit(req, res, next);
      } else {
        this.globalRateLimit(req, res, next);
      }
    });
  }

  private isAuthEndpoint(req: Request): boolean {
    const path = req.path.toLowerCase();
    const body = req.body;

    // Check for GraphQL auth mutations
    if (path.includes('graphql') && body?.query) {
      const query = body.query.toLowerCase();
      return query.includes('login') || 
             query.includes('register') || 
             query.includes('signup') ||
             query.includes('authenticate');
    }

    // Check for REST auth endpoints
    return path.includes('/auth') || 
           path.includes('/login') || 
           path.includes('/register') ||
           path.includes('/signup');
  }
}
