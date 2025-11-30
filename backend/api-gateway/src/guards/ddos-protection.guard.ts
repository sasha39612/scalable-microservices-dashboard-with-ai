/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';

/**
 * DDoS Protection Guard
 * Provides protection against Distributed Denial of Service attacks:
 * - Connection rate limiting per IP
 * - Concurrent connection limits
 * - Request pattern analysis
 * - Geographic blocking (if configured)
 * - Suspicious behavior detection
 */
@Injectable()
export class DdosProtectionGuard implements CanActivate {
  private readonly ipConnectionCount = new Map<string, number>();
  private readonly ipRequestHistory = new Map<string, number[]>();
  private readonly suspiciousIPs = new Set<string>();
  private readonly blacklistedIPs = new Set<string>();
  
  // Configuration
  private readonly maxConcurrentConnections = 100;
  private readonly maxRequestsPerMinute = 300;
  private readonly suspiciousRequestsThreshold = 200;
  private readonly timeWindow = 60 * 1000; // 1 minute
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes
  
  constructor(private reflector: Reflector) {
    // Register this instance globally for service access
    (global as any).ddosGuardInstance = this;
    
    // Cleanup old data periodically
    setInterval(() => this.cleanup(), this.cleanupInterval);
    
    // Initialize with known malicious IPs (example - in production, load from external sources)
    this.blacklistedIPs.add('0.0.0.0');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if DDoS protection is disabled for this route
    const isDdosProtectionDisabled = this.reflector.get<boolean>('disable-ddos', context.getHandler());
    if (isDdosProtectionDisabled) {
      return true;
    }

    const request = this.getRequest(context);
    const clientIP = this.getClientIP(request);

    try {
      // Check if IP is blacklisted
      if (this.blacklistedIPs.has(clientIP)) {
        throw new Error(`Blacklisted IP: ${clientIP}`);
      }

      // Check concurrent connections
      this.checkConcurrentConnections(clientIP);

      // Check request rate
      this.checkRequestRate(clientIP);

      // Analyze request patterns
      this.analyzeRequestPattern(request, clientIP);

      // Check for suspicious behavior
      this.checkSuspiciousBehavior(request, clientIP);

      return true;
    } catch (error) {
      // Log the blocked request for monitoring
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`DDoS Protection: Blocked request from ${clientIP}: ${errorMessage}`);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Request blocked by DDoS protection',
          error: 'DDOS_PROTECTION',
          timestamp: new Date().toISOString(),
          retryAfter: 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private getRequest(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    
    if (ctx && ctx.req) {
      return ctx.req;
    }
    
    return context.switchToHttp().getRequest();
  }

  private getClientIP(request: any): string {
    // Try to get real IP from various headers (for reverse proxy scenarios)
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIP = request.headers['x-real-ip'];
    const cfConnectingIP = request.headers['cf-connecting-ip']; // Cloudflare
    
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    
    if (xRealIP) {
      return xRealIP;
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    return request.connection?.remoteAddress || 
           request.socket?.remoteAddress || 
           request.ip || 
           'unknown';
  }

  private checkConcurrentConnections(clientIP: string): void {
    const currentConnections = this.ipConnectionCount.get(clientIP) || 0;
    
    if (currentConnections >= this.maxConcurrentConnections) {
      throw new Error(`Too many concurrent connections from IP: ${clientIP}`);
    }
    
    // Increment connection count
    this.ipConnectionCount.set(clientIP, currentConnections + 1);
    
    // Decrement after a short delay (simulating connection completion)
    setTimeout(() => {
      const connections = this.ipConnectionCount.get(clientIP) || 0;
      if (connections > 0) {
        this.ipConnectionCount.set(clientIP, connections - 1);
      }
    }, 1000);
  }

  private checkRequestRate(clientIP: string): void {
    const now = Date.now();
    const requests = this.ipRequestHistory.get(clientIP) || [];
    
    // Remove old requests outside time window
    const recentRequests = requests.filter(timestamp => now - timestamp < this.timeWindow);
    
    // Check if rate limit exceeded
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      // Mark as suspicious if exceeding threshold
      if (recentRequests.length >= this.suspiciousRequestsThreshold) {
        this.suspiciousIPs.add(clientIP);
        console.warn(`DDoS Protection: IP ${clientIP} marked as suspicious - ${recentRequests.length} requests in ${this.timeWindow}ms`);
      }
      
      throw new Error(`Rate limit exceeded for IP: ${clientIP}`);
    }
    
    // Add current request timestamp
    recentRequests.push(now);
    this.ipRequestHistory.set(clientIP, recentRequests);
  }

  private analyzeRequestPattern(request: any, clientIP: string): void {
    // Check for automated/bot-like behavior patterns
    const userAgent = request.headers['user-agent'] || '';
    const referer = request.headers['referer'] || '';
    
    // Detect common bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
    ];
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      // Allow legitimate search engine bots
      const legitimateBots = [
        /googlebot/i,
        /bingbot/i,
        /slurp/i, // Yahoo
        /duckduckbot/i,
        /facebookexternalhit/i,
        /twitterbot/i,
        /linkedinbot/i,
      ];
      
      if (!legitimateBots.some(pattern => pattern.test(userAgent))) {
        throw new Error(`Suspicious bot detected from IP: ${clientIP}`);
      }
    }
    
    // Check for missing or suspicious headers
    if (!userAgent || userAgent.length < 10) {
      throw new Error(`Missing or suspicious User-Agent from IP: ${clientIP}`);
    }
    
    // Check for rapid-fire requests with identical patterns
    const requestSignature = this.generateRequestSignature(request);
    const recentSignatures = this.getRecentRequestSignatures(clientIP);
    
    if (recentSignatures.filter(sig => sig === requestSignature).length > 20) {
      throw new Error(`Repetitive request pattern detected from IP: ${clientIP}`);
    }
    
    this.addRequestSignature(clientIP, requestSignature);
  }

  private checkSuspiciousBehavior(request: any, clientIP: string): void {
    // Check if IP is already marked as suspicious
    if (this.suspiciousIPs.has(clientIP)) {
      // Apply stricter limits for suspicious IPs
      const requests = this.ipRequestHistory.get(clientIP) || [];
      const now = Date.now();
      const recentRequests = requests.filter(timestamp => now - timestamp < this.timeWindow);
      
      if (recentRequests.length > 50) { // Much stricter limit for suspicious IPs
        throw new Error(`Suspicious IP rate limit exceeded: ${clientIP}`);
      }
    }
    
    // Check for geographic anomalies (if geo-IP database is available)
    // This would require a geo-IP service integration
    
    // Check for distributed attack patterns
    this.checkDistributedAttack();
  }

  private generateRequestSignature(request: any): string {
    const method = request.method || 'UNKNOWN';
    const path = request.path || request.url || '';
    const userAgent = request.headers['user-agent'] || '';
    
    // Create a simple signature based on request characteristics
    return `${method}:${path}:${userAgent.substring(0, 50)}`;
  }

  private getRecentRequestSignatures(clientIP: string): string[] {
    // This would ideally be stored in Redis for distributed environments
    // For now, using in-memory storage as a simple implementation
    return (global as any)[`signatures_${clientIP}`] || [];
  }

  private addRequestSignature(clientIP: string, signature: string): void {
    const signatures = this.getRecentRequestSignatures(clientIP);
    signatures.push(signature);
    
    // Keep only recent signatures (last 100)
    if (signatures.length > 100) {
      signatures.splice(0, signatures.length - 100);
    }
    
    (global as any)[`signatures_${clientIP}`] = signatures;
  }

  private checkDistributedAttack(): void {
    // Check if we're seeing coordinated attacks from multiple IPs
    const now = Date.now();
    const recentIPs = Array.from(this.ipRequestHistory.entries())
      .filter(([ip, timestamps]) => {
        const recentRequests = timestamps.filter(ts => now - ts < this.timeWindow);
        return recentRequests.length > 100; // IPs with high activity
      })
      .map(([ip]) => ip);
    
    // If we have many high-activity IPs, it might be a distributed attack
    if (recentIPs.length > 20) {
      console.warn(`DDoS Protection: Potential distributed attack detected from ${recentIPs.length} IPs`);
      
      // Mark all high-activity IPs as suspicious
      recentIPs.forEach(ip => this.suspiciousIPs.add(ip));
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const cleanupAge = 10 * 60 * 1000; // 10 minutes
    
    // Clean up old request history
    for (const [ip, timestamps] of this.ipRequestHistory.entries()) {
      const recentRequests = timestamps.filter(ts => now - ts < cleanupAge);
      if (recentRequests.length === 0) {
        this.ipRequestHistory.delete(ip);
      } else {
        this.ipRequestHistory.set(ip, recentRequests);
      }
    }
    
    // Clean up connection counts (should be handled by timeouts, but safety cleanup)
    for (const [ip, count] of this.ipConnectionCount.entries()) {
      if (count <= 0) {
        this.ipConnectionCount.delete(ip);
      }
    }
    
    // Clean up old suspicious IPs (give them a second chance after some time)
    this.suspiciousIPs.clear();
    
    console.log(`DDoS Protection: Cleaned up old data. Active IPs: ${this.ipRequestHistory.size}`);
  }

  // Admin methods for IP management
  public blacklistIP(ip: string): void {
    this.blacklistedIPs.add(ip);
    console.log(`DDoS Protection: IP ${ip} added to blacklist`);
  }

  public removeFromBlacklist(ip: string): void {
    this.blacklistedIPs.delete(ip);
    console.log(`DDoS Protection: IP ${ip} removed from blacklist`);
  }

  public getStats() {
    return {
      blacklistedIPs: Array.from(this.blacklistedIPs),
      suspiciousIPs: Array.from(this.suspiciousIPs),
      activeIPs: this.ipRequestHistory.size,
      totalActiveConnections: Array.from(this.ipConnectionCount.values()).reduce((sum, count) => sum + count, 0),
    };
  }
}