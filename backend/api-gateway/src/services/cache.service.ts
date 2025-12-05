import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private isConnected = false;
  private memoryCache = new Map<string, CacheItem<unknown>>();
  
  // Default TTL values (in seconds)
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly QUERY_CACHE_TTL = 180; // 3 minutes for GraphQL queries
  private readonly USER_CACHE_TTL = 600; // 10 minutes for user data
  private readonly TASK_CACHE_TTL = 60; // 1 minute for task data
  private readonly AI_CACHE_TTL = 900; // 15 minutes for AI responses
  
  // Memory cache cleanup interval
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60000; // 1 minute

  async onModuleInit() {
    await this.initializeRedisClient();
    this.startMemoryCacheCleanup();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async initializeRedisClient(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    const redisPassword = process.env.REDIS_PASSWORD;

    if (!redisUrl) {
      this.logger.warn('Redis not configured. Using in-memory cache only.');
      return;
    }

    try {
      if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
        let finalRedisUrl = redisUrl;
        if (redisPassword && !redisUrl.includes('@')) {
          const urlParts = redisUrl.match(/^(redis:\/\/|rediss:\/\/)(.+)$/);
          if (urlParts) {
            finalRedisUrl = `${urlParts[1]}:${redisPassword}@${urlParts[2]}`;
          }
        }

        this.redisClient = new Redis(finalRedisUrl, {
          retryStrategy: (times) => Math.min(times * 50, 2000),
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
          connectTimeout: 5000,
          commandTimeout: 3000,
        });
      } else {
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        this.redisClient = new Redis({
          host: redisUrl,
          port,
          password: redisPassword,
          retryStrategy: (times) => Math.min(times * 50, 2000),
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
          connectTimeout: 5000,
          commandTimeout: 3000,
        });
      }

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log('🔗 Redis cache connected successfully');
      });

      this.redisClient.on('error', (error) => {
        this.isConnected = false;
        this.logger.error(`❌ Redis cache error: ${error.message}`);
      });

      this.redisClient.on('close', () => {
        this.isConnected = false;
        this.logger.warn('⚠️  Redis cache connection closed');
      });

      this.redisClient.on('reconnecting', () => {
        this.logger.log('🔄 Redis cache reconnecting...');
      });

      // Test connection
      await this.redisClient.ping();
      this.logger.log('✅ Redis cache connection verified');

    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Failed to initialize Redis cache: ${err.message}`);
      this.redisClient = null;
    }
  }

  private startMemoryCacheCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemoryCache();
    }, this.CLEANUP_INTERVAL_MS);
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`🧹 Cleaned ${cleanedCount} expired items from memory cache`);
    }
  }

  /**
   * Get a value from cache (Redis first, fallback to memory)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if available
      if (this.redisClient && this.isConnected) {
        const value = await this.redisClient.get(this.prefixKey(key));
        if (value) {
          this.logger.debug(`📥 Cache hit (Redis): ${key}`);
          return JSON.parse(value) as T;
        }
      }

      // Fallback to memory cache
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem) {
        const now = Date.now();
        if (now - memoryItem.timestamp <= memoryItem.ttl * 1000) {
          this.logger.debug(`📥 Cache hit (Memory): ${key}`);
          return memoryItem.data as T;
        } else {
          // Item expired, remove it
          this.memoryCache.delete(key);
        }
      }

      this.logger.debug(`📭 Cache miss: ${key}`);
      return null;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Cache get error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const finalTtl = ttl || this.DEFAULT_TTL;

    try {
      const serialized = JSON.stringify(value);

      // Try Redis first
      if (this.redisClient && this.isConnected) {
        await this.redisClient.setex(this.prefixKey(key), finalTtl, serialized);
        this.logger.debug(`💾 Cached to Redis: ${key} (TTL: ${finalTtl}s)`);
      }

      // Always store in memory as backup
      this.memoryCache.set(key, {
        data: value,
        timestamp: Date.now(),
        ttl: finalTtl
      });
      
      this.logger.debug(`💾 Cached to memory: ${key} (TTL: ${finalTtl}s)`);
      return true;

    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Cache set error for key ${key}: ${err.message}`);
      
      // Try memory cache as fallback
      try {
        this.memoryCache.set(key, {
          data: value,
          timestamp: Date.now(),
          ttl: finalTtl
        });
        return true;
      } catch (memError) {
        this.logger.error(`❌ Memory cache fallback failed: ${(memError as Error).message}`);
        return false;
      }
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;

      // Delete from Redis
      if (this.redisClient && this.isConnected) {
        const result = await this.redisClient.del(this.prefixKey(key));
        deleted = result > 0;
      }

      // Delete from memory
      const memDeleted = this.memoryCache.delete(key);
      
      this.logger.debug(`🗑️  Deleted cache key: ${key}`);
      return deleted || memDeleted;

    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Cache delete error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      let deletedCount = 0;

      // Delete from Redis
      if (this.redisClient && this.isConnected) {
        const keys = await this.redisClient.keys(this.prefixKey(pattern));
        if (keys.length > 0) {
          const result = await this.redisClient.del(...keys);
          deletedCount += result;
        }
      }

      // Delete from memory cache
      const memoryKeys = Array.from(this.memoryCache.keys()).filter(key => 
        this.matchesPattern(key, pattern)
      );
      
      for (const key of memoryKeys) {
        this.memoryCache.delete(key);
        deletedCount++;
      }

      this.logger.debug(`🗑️  Deleted ${deletedCount} cache keys matching pattern: ${pattern}`);
      return deletedCount;

    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Cache deletePattern error: ${err.message}`);
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      // Check Redis first
      if (this.redisClient && this.isConnected) {
        const result = await this.redisClient.exists(this.prefixKey(key));
        if (result === 1) return true;
      }

      // Check memory cache
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem) {
        const now = Date.now();
        if (now - memoryItem.timestamp <= memoryItem.ttl * 1000) {
          return true;
        } else {
          this.memoryCache.delete(key);
        }
      }

      return false;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Cache exists error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    redisConnected: boolean;
    memoryCacheSize: number;
    memoryCacheKeys: string[];
  } {
    return {
      redisConnected: this.isConnected,
      memoryCacheSize: this.memoryCache.size,
      memoryCacheKeys: Array.from(this.memoryCache.keys()),
    };
  }

  /**
   * Get predefined TTL values
   */
  getTTLs() {
    return {
      DEFAULT: this.DEFAULT_TTL,
      QUERY: this.QUERY_CACHE_TTL,
      USER: this.USER_CACHE_TTL,
      TASK: this.TASK_CACHE_TTL,
      AI: this.AI_CACHE_TTL,
    };
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      // Clear Redis
      if (this.redisClient && this.isConnected) {
        const keys = await this.redisClient.keys(this.prefixKey('*'));
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      }

      // Clear memory cache
      this.memoryCache.clear();

      this.logger.log('🧹 Cleared all cache data');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Error clearing cache: ${err.message}`);
    }
  }

  private prefixKey(key: string): string {
    return `api-gateway:${key}`;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  private async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('🔌 Redis connection closed gracefully');
      } catch (error) {
        this.logger.error('❌ Error closing Redis connection:', (error as Error).message);
      }
    }

    this.memoryCache.clear();
  }
}