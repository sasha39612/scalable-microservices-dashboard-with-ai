import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_CONDITION_METADATA,
  CACHE_INVALIDATE_METADATA,
  CacheKeyUtils,
  InvalidateOptions,
} from '../decorators/cache.decorators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    // Get cache metadata
    const keyTemplate = this.reflector.get<string | Function>(CACHE_KEY_METADATA, handler);
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler);
    const condition = this.reflector.get<Function>(CACHE_CONDITION_METADATA, handler);
    const invalidateConfig = this.reflector.get<InvalidateOptions>(CACHE_INVALIDATE_METADATA, handler);

    const args = context.getArgs();

    // Handle cache invalidation
    if (invalidateConfig) {
      return next.handle().pipe(
        tap(async (result) => {
          await this.handleCacheInvalidation(invalidateConfig, args, result);
        }),
      );
    }

    // Check cache condition
    if (condition && !condition(...args)) {
      this.logger.debug(`🚫 Cache condition not met for ${className}.${methodName}`);
      return next.handle();
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(keyTemplate, className, methodName, args);
    
    // Try to get from cache
    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult !== null) {
      this.logger.debug(`📥 Cache hit: ${cacheKey}`);
      return of(cachedResult);
    }

    // Cache miss - execute method and cache result
    this.logger.debug(`📭 Cache miss: ${cacheKey}`);
    
    return next.handle().pipe(
      tap(async (result) => {
        // Don't cache null/undefined results or errors
        if (result !== null && result !== undefined) {
          const finalTtl = ttl || this.cacheService.getTTLs().DEFAULT;
          await this.cacheService.set(cacheKey, result, finalTtl);
          this.logger.debug(`💾 Cached result: ${cacheKey} (TTL: ${finalTtl}s)`);
        }
      }),
    );
  }

  private generateCacheKey(
    keyTemplate: string | Function | undefined,
    className: string,
    methodName: string,
    args: any[],
  ): string {
    if (keyTemplate) {
      if (typeof keyTemplate === 'function') {
        return keyTemplate(...args);
      }
      return CacheKeyUtils.generateKey(keyTemplate, args);
    }

    // Generate default key
    return CacheKeyUtils.generateDefaultKey(className, methodName, args);
  }

  private async handleCacheInvalidation(
    config: InvalidateOptions,
    args: any[],
    result: any,
  ): Promise<void> {
    try {
      // Check invalidation condition
      if (config.condition && !config.condition(...args, result)) {
        this.logger.debug('🚫 Cache invalidation condition not met');
        return;
      }

      let invalidatedCount = 0;

      // Invalidate specific keys
      if (config.keys) {
        for (const keyTemplate of config.keys) {
          const key = CacheKeyUtils.generateKey(keyTemplate, args);
          const deleted = await this.cacheService.delete(key);
          if (deleted) {
            invalidatedCount++;
            this.logger.debug(`🗑️  Invalidated cache key: ${key}`);
          }
        }
      }

      // Invalidate patterns
      if (config.patterns) {
        for (const patternTemplate of config.patterns) {
          const pattern = CacheKeyUtils.generateKey(patternTemplate, args);
          const deleted = await this.cacheService.deletePattern(pattern);
          invalidatedCount += deleted;
          this.logger.debug(`🗑️  Invalidated ${deleted} keys matching pattern: ${pattern}`);
        }
      }

      if (invalidatedCount > 0) {
        this.logger.log(`🧹 Cache invalidation completed: ${invalidatedCount} items removed`);
      }

    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Cache invalidation error: ${err.message}`);
    }
  }
}