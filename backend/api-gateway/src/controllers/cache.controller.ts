import { Controller, Get, Delete, Post, Body, Param, Query } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { UserRole } from 'common';

interface CacheStats {
  redisConnected: boolean;
  memoryCacheSize: number;
  memoryCacheKeys: string[];
}

interface CacheOperation {
  key?: string;
  pattern?: string;
  ttl?: number;
  value?: any;
}

@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Get cache statistics (Admin only)
   */
  @Roles(UserRole.Admin)
  @Get('stats')
  getCacheStats(): CacheStats {
    return this.cacheService.getCacheStats();
  }

  /**
   * Get cache TTL configurations
   */
  @Roles(UserRole.Admin)
  @Get('ttls')
  getTTLs() {
    return this.cacheService.getTTLs();
  }

  /**
   * Get a specific cache entry (Admin only)
   */
  @Roles(UserRole.Admin)
  @Get('entry/:key')
  async getCacheEntry(@Param('key') key: string) {
    const value = await this.cacheService.get(key);
    const exists = await this.cacheService.exists(key);
    
    return {
      key,
      exists,
      value,
      timestamp: new Date(),
    };
  }

  /**
   * Set a cache entry (Admin only)
   */
  @Roles(UserRole.Admin)
  @Post('entry')
  async setCacheEntry(@Body() operation: CacheOperation) {
    if (!operation.key || operation.value === undefined) {
      throw new Error('Key and value are required');
    }

    const result = await this.cacheService.set(
      operation.key,
      operation.value,
      operation.ttl,
    );

    return {
      success: result,
      key: operation.key,
      ttl: operation.ttl || this.cacheService.getTTLs().DEFAULT,
      timestamp: new Date(),
    };
  }

  /**
   * Delete a specific cache entry (Admin only)
   */
  @Roles(UserRole.Admin)
  @Delete('entry/:key')
  async deleteCacheEntry(@Param('key') key: string) {
    const result = await this.cacheService.delete(key);
    
    return {
      success: result,
      key,
      timestamp: new Date(),
    };
  }

  /**
   * Delete cache entries by pattern (Admin only)
   */
  @Roles(UserRole.Admin)
  @Delete('pattern')
  async deleteCachePattern(@Body() operation: CacheOperation) {
    if (!operation.pattern) {
      throw new Error('Pattern is required');
    }

    const deletedCount = await this.cacheService.deletePattern(operation.pattern);
    
    return {
      success: deletedCount > 0,
      deletedCount,
      pattern: operation.pattern,
      timestamp: new Date(),
    };
  }

  /**
   * Clear all cache entries (Admin only)
   */
  @Roles(UserRole.Admin)
  @Delete('all')
  async clearAllCache() {
    await this.cacheService.clearAll();
    
    return {
      success: true,
      message: 'All cache entries cleared',
      timestamp: new Date(),
    };
  }

  /**
   * Warm up cache with common queries (Admin only)
   */
  @Roles(UserRole.Admin)
  @Post('warmup')
  async warmupCache(@Body() options?: { 
    includeUsers?: boolean; 
    includeTasks?: boolean; 
    includeJobs?: boolean; 
  }) {
    const warmedKeys: string[] = [];
    
    try {
      // This is a placeholder - in a real implementation, you would
      // pre-populate the cache with common queries
      
      // Example: Warm up with system stats
      await this.cacheService.set('system:stats', {
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      }, 300);
      warmedKeys.push('system:stats');

      // Add more warmup logic here based on your specific use case
      
      return {
        success: true,
        warmedKeys,
        count: warmedKeys.length,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        warmedKeys,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Cache health check
   */
  @Get('health')
  async healthCheck() {
    const stats = this.cacheService.getCacheStats();
    
    // Test cache functionality
    const testKey = 'health-test';
    const testValue = { timestamp: Date.now() };
    
    try {
      const setResult = await this.cacheService.set(testKey, testValue, 10);
      const getResult = await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);
      
      const isWorking = setResult && getResult !== null;
      
      return {
        status: stats.redisConnected ? 'healthy' : (isWorking ? 'degraded' : 'unhealthy'),
        details: {
          ...stats,
          testPassed: isWorking,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          ...stats,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        },
      };
    }
  }
}