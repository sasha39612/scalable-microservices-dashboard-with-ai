import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Custom throttler guard for GraphQL
 * Extracts the request from GraphQL context instead of HTTP context
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  /**
   * Get the request object from either HTTP or GraphQL context
   */
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    
    // For GraphQL requests
    if (ctx && ctx.req) {
      return { req: ctx.req, res: ctx.res };
    }
    
    // Fallback to HTTP context (for REST endpoints like health checks)
    return super.getRequestResponse(context);
  }

  /**
   * Generate a unique key for tracking rate limits per user/IP
   * Priority: user ID > IP address
   */
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const { req } = this.getRequestResponse(context);
    
    // If user is authenticated, use their ID
    const userId = req.user?.id || req.user?.sub;
    if (userId) {
      return `throttle:user:${userId}:${name}:${suffix}`;
    }
    
    // Otherwise use IP address
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return `throttle:ip:${ip}:${name}:${suffix}`;
  }
}
