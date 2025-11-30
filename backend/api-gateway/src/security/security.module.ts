import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { WafGuard } from '../guards/waf.guard';
import { DdosProtectionGuard } from '../guards/ddos-protection.guard';
import { RateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { SecurityHeadersMiddleware } from '../middleware/security-headers.middleware';
import { SecurityMonitoringMiddleware } from '../middleware/security-monitoring.middleware';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';

/**
 * Security Module
 * Provides comprehensive security features including:
 * - Web Application Firewall (WAF)
 * - DDoS Protection  
 * - Rate Limiting
 * - Security Headers
 * - Security Monitoring and Alerting
 */
@Module({
  controllers: [SecurityController],
  providers: [
    SecurityService,
    // Apply WAF protection globally
    {
      provide: APP_GUARD,
      useClass: WafGuard,
    },
    // Apply DDoS protection globally
    {
      provide: APP_GUARD,
      useClass: DdosProtectionGuard,
    },
  ],
  exports: [SecurityService],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        SecurityMonitoringMiddleware,
        SecurityHeadersMiddleware,
        RateLimitingMiddleware,
      )
      .forRoutes('*'); // Apply to all routes
  }
}