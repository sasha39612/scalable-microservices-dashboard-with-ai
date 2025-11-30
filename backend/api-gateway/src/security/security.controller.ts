import { Controller, Get, Post, Body, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from 'common';

/**
 * Security Management Controller
 * Provides endpoints for security monitoring, configuration, and management
 * Requires admin authentication for most operations
 */
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  /**
   * Get comprehensive security statistics
   * Requires admin role
   */
  @Get('stats')
  @Roles(UserRole.Admin)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async getSecurityStats() {
    return this.securityService.getSecurityStats();
  }

  /**
   * Generate security report for specified time period
   * Requires admin role
   */
  @Get('report')
  @Roles(UserRole.Admin)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes (resource intensive)
  async getSecurityReport(@Query('hours') hours?: string) {
    const timeRangeHours = hours ? parseInt(hours, 10) : 24;
    return this.securityService.generateSecurityReport(timeRangeHours);
  }

  /**
   * Get security recommendations
   * Requires admin role
   */
  @Get('recommendations')
  @Roles(UserRole.Admin)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  async getSecurityRecommendations() {
    return {
      recommendations: this.securityService.getSecurityRecommendations(),
      timestamp: new Date(),
    };
  }

  /**
   * Health check for security systems
   * Available to authenticated users
   */
  @Get('health')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  async getSecurityHealth() {
    return this.securityService.healthCheck();
  }

  /**
   * Manually blacklist an IP address
   * Requires admin role and reason
   */
  @Post('blacklist')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 requests per 5 minutes
  async blacklistIP(
    @Body('ip') ip: string,
    @Body('reason') reason?: string,
  ) {
    if (!ip || !this.isValidIP(ip)) {
      throw new Error('Valid IP address is required');
    }

    this.securityService.blacklistIP(ip, reason);
    
    return {
      message: `IP ${ip} has been blacklisted`,
      ip,
      reason: reason || 'Manual intervention',
      timestamp: new Date(),
    };
  }

  /**
   * Remove IP from blacklist
   * Requires admin role
   */
  @Post('whitelist')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 requests per 5 minutes
  async removeFromBlacklist(
    @Body('ip') ip: string,
    @Body('reason') reason?: string,
  ) {
    if (!ip || !this.isValidIP(ip)) {
      throw new Error('Valid IP address is required');
    }

    this.securityService.removeFromBlacklist(ip, reason);
    
    return {
      message: `IP ${ip} has been removed from blacklist`,
      ip,
      reason: reason || 'Manual intervention',
      timestamp: new Date(),
    };
  }

  /**
   * Get real-time security metrics (lightweight)
   * Available to authenticated users
   */
  @Get('metrics')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute
  async getSecurityMetrics() {
    const stats = await this.securityService.getSecurityStats();
    
    return {
      summary: {
        totalActiveIPs: stats.ddosStats.activeIPs,
        totalActiveConnections: stats.ddosStats.totalActiveConnections,
        blacklistedIPs: Array.isArray(stats.ddosStats.blacklistedIPs) ? stats.ddosStats.blacklistedIPs.length : 0,
        suspiciousIPs: Array.isArray(stats.ddosStats.suspiciousIPs) ? stats.ddosStats.suspiciousIPs.length : 0,
        recentEventsCount: Array.isArray(stats.securityEvents) ? stats.securityEvents.length : 0,
      },
      systemHealth: {
        uptime: stats.systemHealth.uptime,
        memoryUsage: Math.round((stats.systemHealth.memoryUsage.heapUsed / stats.systemHealth.memoryUsage.heapTotal) * 100),
        status: this.getHealthStatus(stats.systemHealth),
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Get security configuration status
   * Shows which security features are active
   */
  @Get('config')
  @Roles(UserRole.Admin)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getSecurityConfig() {
    return {
      features: {
        waf: {
          enabled: true,
          description: 'Web Application Firewall - Protects against injection attacks, XSS, and other web vulnerabilities',
          rules: ['SQL Injection Protection', 'XSS Protection', 'Path Traversal Protection', 'Command Injection Protection'],
        },
        ddos: {
          enabled: true,
          description: 'DDoS Protection - Prevents distributed denial of service attacks',
          limits: {
            maxConcurrentConnections: 100,
            maxRequestsPerMinute: 300,
            suspiciousThreshold: 200,
          },
        },
        rateLimiting: {
          enabled: true,
          description: 'Rate Limiting - Controls request frequency per client',
          policies: ['Global Rate Limit', 'Auth Endpoint Limit', 'Slow Down Protection'],
        },
        securityHeaders: {
          enabled: true,
          description: 'Security Headers - Adds protective HTTP headers',
          headers: ['Content Security Policy', 'HSTS', 'X-Frame-Options', 'X-Content-Type-Options'],
        },
        monitoring: {
          enabled: true,
          description: 'Security Monitoring - Logs and analyzes security events',
          capabilities: ['Threat Detection', 'Pattern Analysis', 'Alerting', 'Reporting'],
        },
      },
      environment: process.env.NODE_ENV,
      lastUpdated: new Date(),
    };
  }

  /**
   * Simple IP validation
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Determine health status based on system metrics
   */
  private getHealthStatus(health: Record<string, unknown>): 'healthy' | 'warning' | 'critical' {
    const memoryUsage = health.memoryUsage as { used: number; total: number };
    const activeConnections = health.activeConnections as number;
    const memoryUsagePercent = (memoryUsage.used / memoryUsage.total) * 100;
    
    if (memoryUsagePercent > 90 || activeConnections > 1000) {
      return 'critical';
    } else if (memoryUsagePercent > 75 || activeConnections > 500) {
      return 'warning';
    }
    
    return 'healthy';
  }
}