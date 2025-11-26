import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private isConnected = false;

  // Default TTL values (in seconds)
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly CHAT_CACHE_TTL = 1800; // 30 minutes
  private readonly INSIGHTS_CACHE_TTL = 7200; // 2 hours

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    const redisPassword = process.env.REDIS_PASSWORD;

    if (!redisUrl) {
      this.logger.warn('REDIS_URL or REDIS_HOST not configured. Caching will be disabled.');
      return;
    }

    try {
      // Parse Redis URL or create connection from host/port
      if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
        // If URL doesn't contain password but we have REDIS_PASSWORD, construct URL with password
        let finalRedisUrl = redisUrl;
        if (redisPassword && !redisUrl.includes('@')) {
          // Extract protocol and host:port
          const urlParts = redisUrl.match(/^(redis:\/\/|rediss:\/\/)(.+)$/);
          if (urlParts) {
            finalRedisUrl = `${urlParts[1]}:${redisPassword}@${urlParts[2]}`;
          }
        }

        this.client = new Redis(finalRedisUrl, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });
      } else {
        // Fallback to host:port format
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        this.client = new Redis({
          host: redisUrl,
          port,
          password: redisPassword,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });
      }

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis client connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.logger.error(`Redis client error: ${error.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        this.logger.log('Redis client reconnecting...');
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to initialize Redis client: ${err.message}`, err.stack);
      this.client = null;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      this.logger.debug('Cache not available, skipping get operation');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache get error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      this.logger.debug('Cache not available, skipping set operation');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || this.DEFAULT_TTL;

      await this.client.setex(key, ttlSeconds, serialized);
      this.logger.debug(`Cached key ${key} with TTL ${ttlSeconds}s`);
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache set error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      this.logger.debug(`Deleted cache key ${key}`);
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache delete error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(...keys);
      this.logger.debug(`Deleted ${keys.length} cache keys matching pattern ${pattern}`);
      return keys.length;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache deletePattern error for pattern ${pattern}: ${err.message}`);
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache exists error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache getTTL error for key ${key}: ${err.message}`);
      return -1;
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache increment error for key ${key}: ${err.message}`);
      return 0;
    }
  }

  /**
   * Set expiration for an existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache expire error for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Clear all cache keys (use with caution!)
   */
  async clearAll(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushdb();
      this.logger.warn('Cleared all cache keys');
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cache clearAll error: ${err.message}`);
      return false;
    }
  }

  /**
   * Helper methods for specific cache patterns
   */

  // Cache keys for chat conversations
  getChatCacheKey(conversationId: string, messageHash: string): string {
    return `chat:${conversationId}:${messageHash}`;
  }

  // Cache keys for insights
  getInsightsCacheKey(insightType: string, dataHash: string): string {
    return `insights:${insightType}:${dataHash}`;
  }

  // Cache keys for conversation history
  getConversationCacheKey(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  // Get TTL for chat cache
  getChatCacheTTL(): number {
    return this.CHAT_CACHE_TTL;
  }

  // Get TTL for insights cache
  getInsightsCacheTTL(): number {
    return this.INSIGHTS_CACHE_TTL;
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{
    connected: boolean;
    dbSize: number;
    memory: string;
  }> {
    if (!this.client || !this.isConnected) {
      return {
        connected: false,
        dbSize: 0,
        memory: '0',
      };
    }

    try {
      const dbSize = await this.client.dbsize();
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        connected: true,
        dbSize,
        memory,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get cache stats: ${err.message}`);
      return {
        connected: false,
        dbSize: 0,
        memory: '0',
      };
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.logger.log('Closing Redis connection...');
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }
}
