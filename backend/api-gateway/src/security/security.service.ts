/* eslint-disable @typescript-eslint/no-explicit-any */

import { Injectable, Logger } from '@nestjs/common';

interface DDoSGuardStats {
  blacklistedIPs: string[];
  suspiciousIPs: string[];
  activeIPs: number;
  totalActiveConnections: number;
}

interface DDoSGuard {
  getStats: () => DDoSGuardStats;
  blacklistIP: (ip: string) => void;
  removeFromBlacklist: (ip: string) => void;
}

export interface SecurityStats {
  ddosStats: Record<string, unknown>;
  securityEvents: unknown[];
  systemHealth: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    activeConnections: number;
  };
  threatIntelligence: {
    blockedIPs: string[];
    suspiciousActivities: number;
    topAttackTypes: Record<string, number>;
  };
}

/**
 * Security Service
 * Central service for managing security features and providing security analytics
 */
@Injectable()
export class SecurityService {
  private readonly logger = new Logger('SecurityService');
  private readonly startTime = Date.now();
  
  // Store references to security components via global registry
  private get ddosGuard(): DDoSGuard | undefined {
    return (global as Record<string, unknown>).ddosGuardInstance as DDoSGuard | undefined;
  }
  
  private get securityMonitoring(): any | undefined {
    return (global as Record<string, unknown>).securityMonitoringInstance;
  }

  /**
   * Get comprehensive security statistics
   */
  async getSecurityStats(): Promise<SecurityStats> {
    const ddosStats = this.ddosGuard?.getStats() || {
      blacklistedIPs: [],
      suspiciousIPs: [],
      activeIPs: 0,
      totalActiveConnections: 0,
    };
    
    const securityStats = this.securityMonitoring?.getSecurityStats() || {
      total: 0,
      byType: {},
      bySeverity: {},
      topIPs: {},
      topEndpoints: {},
      timeline: [],
    };
    
    const recentEvents = this.securityMonitoring?.getRecentEvents(50) || [];
    
    return {
      ddosStats: ddosStats as unknown as Record<string, unknown>,
      securityEvents: recentEvents,
      systemHealth: this.getSystemHealth(),
      threatIntelligence: {
        blockedIPs: ddosStats.blacklistedIPs,
        suspiciousActivities: (securityStats.bySeverity?.HIGH || 0) + (securityStats.bySeverity?.CRITICAL || 0),
        topAttackTypes: securityStats.byType,
      },
    };
  }

  /**
   * Manually blacklist an IP address
   */
  blacklistIP(ip: string, reason?: string): void {
    if (this.ddosGuard) {
      this.ddosGuard.blacklistIP(ip);
    }
    
    this.logger.warn(`IP ${ip} manually blacklisted. Reason: ${reason || 'Manual intervention'}`);
    
    // Log as security event
    if (this.securityMonitoring) {
      this.securityMonitoring.logSecurityEvent({
        type: 'DDOS_BLOCK',
        ip: ip,
        userAgent: 'System',
        endpoint: 'Manual blacklist',
        timestamp: new Date(),
        details: { reason: reason || 'Manual intervention', action: 'blacklist' },
        severity: 'HIGH',
      });
    }
  }

  /**
   * Remove IP from blacklist
   */
  removeFromBlacklist(ip: string, reason?: string): void {
    if (this.ddosGuard) {
      this.ddosGuard.removeFromBlacklist(ip);
    }
    
    this.logger.log(`IP ${ip} removed from blacklist. Reason: ${reason || 'Manual intervention'}`);
    
    // Log as security event
    if (this.securityMonitoring) {
      this.securityMonitoring.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: ip,
        userAgent: 'System',
        endpoint: 'Manual whitelist',
        timestamp: new Date(),
        details: { reason: reason || 'Manual intervention', action: 'remove_blacklist' },
        severity: 'MEDIUM',
      });
    }
  }

  /**
   * Get system health metrics
   */
  private getSystemHealth() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    
    // CPU usage calculation (simplified)
    const cpuUsage = process.cpuUsage();
    
    return {
      uptime,
      memoryUsage,
      cpuUsage,
      activeConnections: this.ddosGuard?.getStats().totalActiveConnections || 0,
    };
  }

  /**
   * Get security recommendations based on current threat landscape
   */
  getSecurityRecommendations(): string[] {
    if (!this.securityMonitoring) {
      return ['Security monitoring not available. Ensure security middleware is properly configured.'];
    }
    
    const stats = this.securityMonitoring.getSecurityStats();
    const recommendations: string[] = [];

    // Analyze attack patterns and provide recommendations
    const criticalEvents = stats.bySeverity?.CRITICAL || 0;
    const highEvents = stats.bySeverity?.HIGH || 0;

    if (criticalEvents > 10) {
      recommendations.push('URGENT: High number of critical security events detected. Consider implementing emergency response procedures.');
    }

    if (highEvents > 50) {
      recommendations.push('Consider tightening rate limiting policies due to increased suspicious activity.');
    }

    if (stats.byType?.WAF_BLOCK > 20) {
      recommendations.push('High WAF activity detected. Review and update WAF rules if necessary.');
    }

    if (stats.byType?.DDOS_BLOCK > 15) {
      recommendations.push('DDoS activity detected. Consider implementing additional network-level protections.');
    }

    const ddosStats = this.ddosGuard?.getStats();
    if (ddosStats && ddosStats.suspiciousIPs.length > 10) {
      recommendations.push('Multiple suspicious IPs detected. Review and consider bulk blocking.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture looks good. Continue monitoring for anomalies.');
    }

    return recommendations;
  }

  /**
   * Generate security report for a specific time period
   */
  async generateSecurityReport(timeRangeHours: number = 24): Promise<Record<string, unknown>> {
    const timeRange = timeRangeHours * 60 * 60 * 1000;
    const securityStats = this.securityMonitoring?.getSecurityStats(timeRange) || {
      total: 0,
      byType: {},
      bySeverity: {},
      topIPs: {},
      topEndpoints: {},
      timeline: [],
    };
    
    const ddosStats = this.ddosGuard?.getStats() || {
      blacklistedIPs: [],
      suspiciousIPs: [],
    };
    
    const report = {
      reportPeriod: {
        start: new Date(Date.now() - timeRange),
        end: new Date(),
        durationHours: timeRangeHours,
      },
      summary: {
        totalEvents: securityStats.total,
        criticalEvents: securityStats.bySeverity?.CRITICAL || 0,
        highSeverityEvents: securityStats.bySeverity?.HIGH || 0,
        blockedRequests: (securityStats.byType?.WAF_BLOCK || 0) + (securityStats.byType?.DDOS_BLOCK || 0),
        topAttackSources: this.getTopAttackSources(securityStats.topIPs),
        mostTargetedEndpoints: this.getTopTargets(securityStats.topEndpoints),
      },
      threats: {
        wafBlocks: securityStats.byType?.WAF_BLOCK || 0,
        ddosBlocks: securityStats.byType?.DDOS_BLOCK || 0,
        rateLimitHits: securityStats.byType?.RATE_LIMIT || 0,
        suspiciousActivity: securityStats.byType?.SUSPICIOUS_ACTIVITY || 0,
      },
      mitigation: {
        blacklistedIPs: ddosStats.blacklistedIPs.length,
        suspiciousIPs: ddosStats.suspiciousIPs.length,
        activeProtections: ['WAF', 'DDoS Protection', 'Rate Limiting', 'Security Headers'],
      },
      recommendations: this.getSecurityRecommendations(),
      timeline: securityStats.timeline,
    };

    this.logger.log(`Generated security report for ${timeRangeHours}h period: ${securityStats.total} events processed`);
    
    return report;
  }

  private getTopAttackSources(ipCounts: Record<string, number>): Array<{ip: string, requests: number}> {
    return Object.entries(ipCounts || {})
      .map(([ip, count]) => ({ ip, requests: count }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
  }

  private getTopTargets(endpointCounts: Record<string, number>): Array<{endpoint: string, requests: number}> {
    return Object.entries(endpointCounts || {})
      .map(([endpoint, count]) => ({ endpoint, requests: count }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
  }

  /**
   * Health check for security systems
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details: any }> {
    try {
      const systemHealth = this.getSystemHealth();
      const memoryTotal = systemHealth.memoryUsage.heapTotal;
      const memoryUsed = systemHealth.memoryUsage.heapUsed;
      const memoryUsagePercent = memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      const issues: string[] = [];

      // Check memory usage
      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
        issues.push('High memory usage detected');
      } else if (memoryUsagePercent > 75) {
        status = 'degraded';
        issues.push('Elevated memory usage');
      }

      // Check for recent critical events
      if (this.securityMonitoring) {
        const recentCritical = this.securityMonitoring.getSecurityStats(5 * 60 * 1000); // Last 5 minutes
        if ((recentCritical.bySeverity?.CRITICAL || 0) > 5) {
          status = 'unhealthy';
          issues.push('High number of critical security events');
        }
      }

      // Check if security components are available
      if (!this.ddosGuard) {
        issues.push('DDoS protection not available');
      }
      
      if (!this.securityMonitoring) {
        issues.push('Security monitoring not available');
      }

      return {
        status,
        details: {
          uptime: systemHealth.uptime,
          memoryUsagePercent: Math.round(memoryUsagePercent),
          activeConnections: systemHealth.activeConnections,
          securityComponents: {
            ddosProtection: !!this.ddosGuard,
            securityMonitoring: !!this.securityMonitoring,
          },
          issues: issues.length > 0 ? issues : ['All security systems operational'],
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      this.logger.error('Security health check failed', error);
      return {
        status: 'unhealthy',
        details: {
          error: 'Health check failed',
          lastUpdated: new Date(),
        },
      };
    }
  }
}