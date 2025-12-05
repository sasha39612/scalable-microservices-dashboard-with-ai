import { SetMetadata } from '@nestjs/common';

// Metadata keys
export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_CONDITION_METADATA = 'cache:condition';
export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

// Cache configuration interface
export interface CacheOptions {
  key?: string | ((...args: unknown[]) => string);
  ttl?: number;
  condition?: (...args: unknown[]) => boolean;
}

export interface InvalidateOptions {
  keys?: string[];
  patterns?: string[];
  condition?: (...args: unknown[]) => boolean;
}

/**
 * Cacheable decorator - marks a method for caching
 * 
 * @param options Cache configuration options
 * 
 * @example
 * ```typescript
 * @Cacheable({ key: 'user:{{id}}', ttl: 300 })
 * async getUser(id: string) {
 *   return this.userRepository.findById(id);
 * }
 * 
 * @Cacheable({ 
 *   key: (userId, type) => `tasks:${userId}:${type}`,
 *   condition: (userId) => !!userId 
 * })
 * async getUserTasks(userId: string, type: string) {
 *   return this.taskRepository.findByUser(userId, type);
 * }
 * ```
 */
export function Cacheable(options: CacheOptions = {}): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, options.key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, options.ttl)(target, propertyKey, descriptor);
    SetMetadata(CACHE_CONDITION_METADATA, options.condition)(target, propertyKey, descriptor);
  };
}

/**
 * CacheInvalidate decorator - marks a method to invalidate cache keys/patterns
 * 
 * @param options Invalidation configuration
 * 
 * @example
 * ```typescript
 * @CacheInvalidate({ 
 *   keys: ['user:{{id}}'],
 *   patterns: ['tasks:{{id}}:*'] 
 * })
 * async updateUser(id: string, data: UpdateUserDto) {
 *   return this.userRepository.update(id, data);
 * }
 * 
 * @CacheInvalidate({
 *   patterns: ['tasks:*'],
 *   condition: (taskData) => taskData.priority === 'high'
 * })
 * async createTask(taskData: CreateTaskDto) {
 *   return this.taskRepository.create(taskData);
 * }
 * ```
 */
export function CacheInvalidate(options: InvalidateOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_INVALIDATE_METADATA, options)(target, propertyKey, descriptor);
  };
}

/**
 * CacheKey decorator - specifies a custom cache key for a method
 * 
 * @param keyTemplate Template string with placeholders or function
 * 
 * @example
 * ```typescript
 * @CacheKey('user:{{id}}:profile')
 * async getUserProfile(id: string) {
 *   return this.userRepository.getProfile(id);
 * }
 * 
 * @CacheKey((userId, includeSettings) => 
 *   `user:${userId}:${includeSettings ? 'full' : 'basic'}`
 * )
 * async getUser(userId: string, includeSettings: boolean) {
 *   return this.userRepository.findById(userId, includeSettings);
 * }
 * ```
 */
export function CacheKey(keyTemplate: string | ((...args: unknown[]) => string)): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, keyTemplate)(target, propertyKey, descriptor);
  };
}

/**
 * CacheTTL decorator - specifies TTL for cached method results
 * 
 * @param ttl Time to live in seconds
 * 
 * @example
 * ```typescript
 * @CacheTTL(3600) // 1 hour
 * async getSystemStats() {
 *   return this.metricsService.getStats();
 * }
 * ```
 */
export function CacheTTL(ttl: number): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
  };
}

/**
 * NoCache decorator - disables caching for a method
 * 
 * @example
 * ```typescript
 * @NoCache()
 * async createPayment(data: PaymentDto) {
 *   return this.paymentService.process(data);
 * }
 * ```
 */
export function NoCache(): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_CONDITION_METADATA, () => false)(target, propertyKey, descriptor);
  };
}

/**
 * Utility functions for cache key generation
 */
import { createHash } from 'crypto';

export class CacheKeyUtils {
  /**
   * Generate cache key from template and arguments
   * 
   * @param template Template string with {{param}} placeholders
   * @param args Method arguments
   * @param paramNames Parameter names from method signature
   * @returns Generated cache key
   */
  static generateKey(
    template: string | ((...args: unknown[]) => string),
    args: unknown[],
    paramNames: string[] = []
  ): string {
    if (typeof template === 'function') {
      return template(...args);
    }

    let key = template;
    
    // Replace {{index}} placeholders (e.g., {{0}}, {{1}})
    args.forEach((arg, index) => {
      const placeholder = `{{${index}}}`;
      const value = typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      key = key.replace(new RegExp(placeholder, 'g'), value);
    });

    // Replace {{paramName}} placeholders if param names are available
    if (paramNames.length > 0) {
      paramNames.forEach((paramName, index) => {
        const placeholder = `{{${paramName}}}`;
        const value = typeof args[index] === 'object' 
          ? JSON.stringify(args[index]) 
          : String(args[index]);
        key = key.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    return key;
  }

  /**
   * Generate default cache key for method
   * 
   * @param className Class name
   * @param methodName Method name
   * @param args Arguments
   * @returns Generated cache key
   */
  static generateDefaultKey(className: string, methodName: string, args: unknown[]): string {
    const argsHash = args.length > 0 ? JSON.stringify(args) : 'no-args';
    const hash = createHash('md5')
      .update(argsHash)
      .digest('hex')
      .substring(0, 8);
    
    return `${className}:${methodName}:${hash}`;
  }

  /**
   * Check if cache key template is valid
   */
  static isValidTemplate(template: string): boolean {
    // Check for balanced curly braces
    const openBraces = (template.match(/{{/g) || []).length;
    const closeBraces = (template.match(/}}/g) || []).length;
    return openBraces === closeBraces;
  }
}