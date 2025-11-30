/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

interface SecurityEvent {
  type: 'WAF_BLOCK' | 'DDOS_BLOCK' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'AUTH_FAILURE';
  ip: string;
  userAgent: string;
  endpoint: string;
  timestamp: Date;
  details?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Security Monitoring Middleware
 * Logs and monitors security events for analysis and alerting
 */
@Injectable()
export class SecurityMonitoringMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SecurityMonitoring');
  private readonly securityEvents: SecurityEvent[] = [];
  private readonly maxEvents = 10000; // Keep last 10k events in memory

  // Threat intelligence patterns
  private readonly knownMaliciousPatterns = [
    /\.php$/i,
    /wp-admin/i,
    /wp-login/i,
    /\.env$/i,
    /config\.json$/i,
    /admin\.php$/i,
    /phpmyadmin/i,
    /\.git\//i,
    /\.svn\//i,
  ];

  private readonly suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i,
    /metasploit/i,
    /w3af/i,
    /acunetix/i,
    /netsparker/i,
    /appscan/i,
    /veracode/i,
    /checkmarx/i,
  ];

  constructor() {
    // Register this instance globally for service access
    (global as any).securityMonitoringInstance = this;
    
    // Periodic cleanup of old events
    setInterval(() => this.cleanupOldEvents(), 5 * 60 * 1000);
  }

  use(req: any, res: any, next: any) {
    const startTime = Date.now();
    const clientIP = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Monitor for suspicious patterns
    this.checkSuspiciousActivity(req, clientIP, userAgent);

    // Override response methods to capture security events
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(body: any) {
      const statusCode = res.statusCode;
      const responseTime = Date.now() - startTime;
      
      if (statusCode === 429) {
        // Rate limiting triggered
        (req as any).securityMonitoring?.logSecurityEvent({
          type: 'RATE_LIMIT',
          ip: clientIP,
          userAgent,
          endpoint: req.path,
          timestamp: new Date(),
          details: { responseTime, body },
          severity: 'MEDIUM',
        });
      } else if (statusCode === 403) {
        // Access denied
        (req as any).securityMonitoring?.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          ip: clientIP,
          userAgent,
          endpoint: req.path,
          timestamp: new Date(),
          details: { responseTime, reason: 'Access denied' },
          severity: 'HIGH',
        });
      } else if (statusCode >= 400 && statusCode < 500) {
        // Client errors - potential attack attempts
        (req as any).securityMonitoring?.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          ip: clientIP,
          userAgent,
          endpoint: req.path,
          timestamp: new Date(),
          details: { statusCode, responseTime },
          severity: 'LOW',
        });
      }
      
      return originalSend.call(this, body);
    };

    res.json = function(body: any) {
      // Similar monitoring for JSON responses
      const statusCode = res.statusCode;
      
      if (body?.error === 'WAF_BLOCKED') {
        (req as any).securityMonitoring?.logSecurityEvent({
          type: 'WAF_BLOCK',
          ip: clientIP,
          userAgent,
          endpoint: req.path,
          timestamp: new Date(),
          details: body,
          severity: 'HIGH',
        });
      } else if (body?.error === 'DDOS_PROTECTION') {
        (req as any).securityMonitoring?.logSecurityEvent({
          type: 'DDOS_BLOCK',
          ip: clientIP,
          userAgent,
          endpoint: req.path,
          timestamp: new Date(),
          details: body,
          severity: 'CRITICAL',
        });
      }
      
      return originalJson.call(this, body);
    };

    // Attach monitoring instance to request for use by guards/interceptors
    (req as any).securityMonitoring = this;

    next();
  }

  private getClientIP(req: any): string {
    return req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
           req.headers['x-real-ip']?.toString() ||
           req.headers['cf-connecting-ip']?.toString() ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  private checkSuspiciousActivity(req: any, clientIP: string, userAgent: string) {
    const url = req.url;
    const method = req.method;
    
    // Check for known malicious patterns in URL
    if (this.knownMaliciousPatterns.some(pattern => pattern.test(url))) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent,
        endpoint: url,
        timestamp: new Date(),
        details: { reason: 'Malicious URL pattern detected', method },
        severity: 'HIGH',
      });
    }

    // Check for suspicious user agents
    if (this.suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent,
        endpoint: url,
        timestamp: new Date(),
        details: { reason: 'Suspicious user agent detected', method },
        severity: 'HIGH',
      });
    }

    // Check for unusual HTTP methods
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(method)) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent,
        endpoint: url,
        timestamp: new Date(),
        details: { reason: 'Unusual HTTP method', method },
        severity: 'MEDIUM',
      });
    }

    // Check for excessively long URLs (potential buffer overflow attempts)
    if (url.length > 2048) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent,
        endpoint: url.substring(0, 100) + '...',
        timestamp: new Date(),
        details: { reason: 'Excessively long URL', urlLength: url.length },
        severity: 'MEDIUM',
      });
    }
  }

  public logSecurityEvent(event: SecurityEvent): void {
    // Add to in-memory storage
    this.securityEvents.push(event);
    
    // Keep only recent events
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents.splice(0, this.securityEvents.length - this.maxEvents);
    }

    // Log based on severity
    const logMessage = `Security Event: ${event.type} from ${event.ip} on ${event.endpoint}`;
    
    switch (event.severity) {
      case 'CRITICAL':
        this.logger.error(logMessage, JSON.stringify(event));
        break;
      case 'HIGH':
        this.logger.warn(logMessage, JSON.stringify(event));
        break;
      case 'MEDIUM':
        this.logger.log(logMessage);
        break;
      case 'LOW':
        this.logger.debug(logMessage);
        break;
    }

    // In production, you might want to:
    // 1. Send alerts for CRITICAL/HIGH severity events
    // 2. Store events in a database or SIEM system
    // 3. Trigger automated responses (e.g., temporary IP blocking)
    
    if (event.severity === 'CRITICAL') {
      this.sendAlert(event);
    }
  }

  private sendAlert(event: SecurityEvent): void {
    // Implement alerting mechanism (email, Slack, PagerDuty, etc.)
    console.warn('🚨 CRITICAL SECURITY EVENT 🚨', {
      type: event.type,
      ip: event.ip,
      endpoint: event.endpoint,
      timestamp: event.timestamp,
      details: event.details,
    });
    
    // In production, you might integrate with:
    // - Email service (SendGrid, AWS SES)
    // - Slack webhook
    // - PagerDuty API
    // - SMS service (Twilio)
    // - Security orchestration platform
  }

  private cleanupOldEvents(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const initialLength = this.securityEvents.length;
    
    // Remove events older than 24 hours
    const recentEvents = this.securityEvents.filter(event => event.timestamp > oneDayAgo);
    this.securityEvents.splice(0, this.securityEvents.length, ...recentEvents);
    
    const removedCount = initialLength - this.securityEvents.length;
    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} old security events`);
    }
  }

  // Analytics methods
  public getSecurityStats(timeRange: number = 24 * 60 * 60 * 1000): any {
    const since = new Date(Date.now() - timeRange);
    const recentEvents = this.securityEvents.filter(event => event.timestamp > since);
    
    const stats: any = {
      total: recentEvents.length,
      byType: {},
      bySeverity: {},
      topIPs: {},
      topEndpoints: {},
      timeline: this.generateTimeline(recentEvents),
    };
    
    recentEvents.forEach(event => {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      
      // Count by IP
      stats.topIPs[event.ip] = (stats.topIPs[event.ip] || 0) + 1;
      
      // Count by endpoint
      stats.topEndpoints[event.endpoint] = (stats.topEndpoints[event.endpoint] || 0) + 1;
    });
    
    return stats;
  }

  private generateTimeline(events: SecurityEvent[]): any[] {
    const buckets: any = {};
    const bucketSize = 60 * 60 * 1000; // 1 hour buckets
    
    events.forEach(event => {
      const bucket = Math.floor(event.timestamp.getTime() / bucketSize) * bucketSize;
      if (!buckets[bucket]) {
        buckets[bucket] = { timestamp: new Date(bucket), count: 0, types: {} };
      }
      buckets[bucket].count++;
      buckets[bucket].types[event.type] = (buckets[bucket].types[event.type] || 0) + 1;
    });
    
    return Object.values(buckets).sort((a: any, b: any) => a.timestamp - b.timestamp);
  }

  public getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}