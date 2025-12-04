import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { createHash } from 'crypto';

interface CacheConfig {
  ttl?: number;
  key?: string;
  condition?: (context: ExecutionContext) => boolean;
}

@Injectable()
export class GraphQLCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GraphQLCacheInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const args = gqlContext.getArgs();
    const request = gqlContext.getContext().req;

    // Only cache queries, not mutations or subscriptions
    if (info.operation.operation !== 'query') {
      return next.handle();
    }

    // Check if caching is disabled for this query
    const noCacheDirective = this.hasNoCacheDirective(info);
    if (noCacheDirective) {
      this.logger.debug(`🚫 Caching disabled for query: ${info.fieldName}`);
      return next.handle();
    }

    // Generate cache key based on query, variables, and user context
    const cacheKey = this.generateCacheKey(info, args, request);
    
    // Check cache first
    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult !== null) {
      this.logger.debug(`📥 Cache hit for query: ${info.fieldName}`);
      return of(cachedResult);
    }

    // Cache miss - execute query and cache result
    this.logger.debug(`📭 Cache miss for query: ${info.fieldName}`);
    
    return next.handle().pipe(
      map((data) => {
        // Don't cache null or error results
        if (data === null || data === undefined) {
          return data;
        }
        return data;
      }),
      tap(async (data) => {
        if (data !== null && data !== undefined) {
          const ttl = this.getTTLForQuery(info.fieldName);
          await this.cacheService.set(cacheKey, data, ttl);
          this.logger.debug(`💾 Cached result for query: ${info.fieldName} (TTL: ${ttl}s)`);
        }
      }),
    );
  }

  private generateCacheKey(info: any, args: any, request: any): string {
    const queryName = info.fieldName;
    const operation = info.operation.loc.source.body;
    
    // Include user ID for user-specific queries
    const userId = request.user?.id || 'anonymous';
    
    // Create a hash of the query and arguments for consistent key generation
    const queryHash = createHash('sha256')
      .update(operation + JSON.stringify(args) + userId)
      .digest('hex')
      .substring(0, 16);

    return `gql:${queryName}:${queryHash}`;
  }

  private getTTLForQuery(queryName: string): number {
    const ttls = this.cacheService.getTTLs();

    // Define TTL based on query type
    switch (true) {
      case queryName.includes('user') || queryName.includes('profile'):
        return ttls.USER;
      case queryName.includes('task') || queryName.includes('job'):
        return ttls.TASK;
      case queryName.includes('ai') || queryName.includes('chat') || queryName.includes('insight'):
        return ttls.AI;
      case queryName.includes('dashboard') || queryName.includes('analytics'):
        return ttls.QUERY;
      default:
        return ttls.DEFAULT;
    }
  }

  private hasNoCacheDirective(info: any): boolean {
    // Check if the query has a @noCache directive
    const directives = info.fieldNodes[0]?.directives || [];
    return directives.some((directive: any) => directive.name.value === 'noCache');
  }
}