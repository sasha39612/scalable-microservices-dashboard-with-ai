import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to disable WAF protection for specific routes
 * Use with caution and only when necessary (e.g., file upload endpoints)
 */
export const DisableWaf = () => SetMetadata('disable-waf', true);

/**
 * Decorator to disable DDoS protection for specific routes
 * Use with caution and only for trusted endpoints
 */
export const DisableDdosProtection = () => SetMetadata('disable-ddos', true);

/**
 * Decorator to mark endpoints as security-critical
 * These endpoints will receive additional monitoring and logging
 */
export const SecurityCritical = () => SetMetadata('security-critical', true);

/**
 * Decorator to set custom rate limiting for specific endpoints
 * @param options Rate limiting configuration
 */
export const CustomRateLimit = (options: { limit: number; ttl: number }) => 
  SetMetadata('custom-rate-limit', options);