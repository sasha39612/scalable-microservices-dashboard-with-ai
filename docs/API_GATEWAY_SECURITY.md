# API Gateway Security

Security architecture for the API Gateway, providing layered protection against common web attacks, DDoS attempts, and abuse.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Security                     │
├─────────────────────────────────────────────────────────────┤
│  Security Monitoring Middleware                              │
│  ├── Event Logging                                           │
│  ├── Pattern Analysis                                        │
│  └── Threat Intelligence                                     │
├─────────────────────────────────────────────────────────────┤
│  Security Headers Middleware                                 │
│  ├── Helmet Integration                                      │
│  ├── Custom Headers                                          │
│  └── Development Mode Headers                                │
├─────────────────────────────────────────────────────────────┤
│  Rate Limiting Middleware                                    │
│  ├── Express Rate Limit                                      │
│  ├── Slow Down Protection                                    │
│  └── Context-aware Limiting                                  │
├─────────────────────────────────────────────────────────────┤
│  WAF Guard                                                    │
│  ├── SQL Injection Detection                                 │
│  ├── XSS Protection                                          │
│  ├── Path Traversal Prevention                               │
│  ├── Command Injection Detection                             │
│  └── File Upload Security                                    │
├─────────────────────────────────────────────────────────────┤
│  DDoS Protection Guard                                        │
│  ├── IP Rate Limiting                                         │
│  ├── Connection Limiting                                       │
│  ├── Pattern Analysis                                          │
│  └── Automatic Blacklisting                                    │
├─────────────────────────────────────────────────────────────┤
│  NestJS Throttler Integration                                  │
│  ├── GraphQL Support                                            │
│  ├── Multi-tier Limits                                           │
│  └── Redis Storage Support                                        │
└─────────────────────────────────────────────────────────────┘
```

> Note: for the day-to-day rate-limit configuration and tuning, see [RATE_LIMITING.md](./RATE_LIMITING.md). This document covers the WAF, DDoS protection, security headers, and monitoring layers that sit alongside rate limiting.

## Web Application Firewall (WAF)

**Location**: `src/guards/waf.guard.ts`

Protects against common web vulnerabilities by scanning request bodies, query parameters, and headers (with URL/HTML entity decoding):

- **SQL Injection** — pattern-based detection
- **XSS** — HTML/JavaScript pattern detection
- **Path Traversal** — detects `../`, `..\`, etc.
- **Command Injection** — blocks OS command injection attempts
- **LDAP Injection** — protects LDAP queries
- **NoSQL Injection** — MongoDB/NoSQL pattern detection
- **File Upload Security** — validates uploads, blocks suspicious files, enforces request size limits

Disable per-route with `@DisableWaf()`.

```typescript
// Add custom WAF patterns in src/guards/waf.guard.ts
private readonly customPatterns = [
  /your-custom-pattern/gi,
];
```

## DDoS Protection

**Location**: `src/guards/ddos-protection.guard.ts`

- **Connection Rate Limiting**: max 100 concurrent connections per IP
- **Request Rate Analysis**: 300 requests/minute per IP; suspicious threshold at 200/minute
- **Behavioral Analysis**: bot detection and suspicious-activity identification
- **Geographic Anomaly Detection**: IP-based location analysis
- **Distributed Attack Detection**: recognizes coordinated attacks across IPs
- **Automatic IP Blacklisting**: temporary blocks for persistent attackers

Disable per-route with `@DisableDdosProtection()`.

## Security Headers

**Location**: `src/middleware/security-headers.middleware.ts` (built on Helmet.js)

| Header | Purpose |
|---|---|
| `Content-Security-Policy` | Prevents XSS and data injection |
| `Strict-Transport-Security` (HSTS) | Enforces HTTPS |
| `X-Frame-Options` | Prevents clickjacking |
| `X-Content-Type-Options` | Prevents MIME sniffing |
| `X-Permitted-Cross-Domain-Policies` | Restricts cross-domain policies |
| `Referrer-Policy` | Controls referrer information leakage |
| `Permissions-Policy` | Restricts access to browser features |
| `Cache-Control` | Prevents caching of sensitive data |

## Security Monitoring & Alerting

**Location**: `src/middleware/security-monitoring.middleware.ts`

Real-time event tracking with severity classification (`LOW` / `MEDIUM` / `HIGH` / `CRITICAL`).

### Event Types

| Event Type | Severity | Description |
|---|---|---|
| `WAF_BLOCK` | HIGH | WAF blocked a request |
| `DDOS_BLOCK` | CRITICAL | DDoS protection blocked a request |
| `RATE_LIMIT` | MEDIUM | Rate limit triggered |
| `SUSPICIOUS_ACTIVITY` | Variable | Unusual behavior detected |
| `AUTH_FAILURE` | LOW–HIGH | Authentication attempt failed |

Critical events trigger immediate alerts: console warnings, structured logs (SIEM-ready), and configurable webhook notifications (email/Slack/PagerDuty-ready). Alert conditions: >5 critical events in 5 minutes, memory usage >90%, coordinated DDoS activity from multiple IPs, or a high volume of WAF blocks.

Manually log an event:

```typescript
this.securityMonitoring.logSecurityEvent({
  type: 'SUSPICIOUS_ACTIVITY',
  ip: clientIP,
  userAgent: req.headers['user-agent'],
  endpoint: req.path,
  timestamp: new Date(),
  details: { reason: 'Custom security check failed' },
  severity: 'HIGH',
});
```

## GraphQL Security

- Maximum query depth: 10 levels
- Complexity scoring for resource-intensive operations, with automatic rejection past the threshold

## Security Module Integration

```typescript
// src/security/security.module.ts
@Module({
  providers: [
    SecurityService,
    { provide: APP_GUARD, useClass: WafGuard },
    { provide: APP_GUARD, useClass: DdosProtectionGuard },
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        SecurityMonitoringMiddleware,
        SecurityHeadersMiddleware,
        RateLimitingMiddleware,
      )
      .forRoutes('*');
  }
}
```

## Security Management Endpoints

```
GET  /security/stats            # Comprehensive security statistics
GET  /security/report?hours=24  # Generate a security report
GET  /security/health           # Security system health check
GET  /security/metrics          # Real-time security metrics
GET  /security/config           # Security configuration status
GET  /security/recommendations  # Security recommendations
POST /security/blacklist        # Manually blacklist an IP
POST /security/whitelist        # Remove an IP from the blacklist
```

```bash
# Blacklist an IP
curl -X POST http://localhost:4000/security/blacklist \
  -d '{"ip": "192.168.1.100", "reason": "Persistent brute force attacks"}'

# Remove from blacklist
curl -X POST http://localhost:4000/security/whitelist \
  -d '{"ip": "192.168.1.100", "reason": "False positive resolved"}'
```

## Environment Variables

```bash
# Redis (optional — enables distributed rate limiting / DDoS tracking)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

NODE_ENV=production
```

## Per-Endpoint Control Decorators

```typescript
@DisableWaf()                                  // Disable WAF for this endpoint
@DisableDdosProtection()                       // Disable DDoS protection
@SecurityCritical()                            // Mark as security-critical for enhanced monitoring
@CustomRateLimit({ limit: 10, ttl: 60000 })    // Custom rate limit
```

## Testing

```bash
# Rate limiting
for i in {1..20}; do curl -X POST http://localhost:4000/graphql; done

# WAF
curl -X POST http://localhost:4000/graphql -d '{"query": "SELECT * FROM users"}'

# DDoS protection (requires simulating multiple IPs/bots)
curl -X POST http://localhost:4000/graphql --user-agent "sqlmap"

# Security health
curl http://localhost:4000/security/health
```

## Production Recommendations

- **Redis**: enable for distributed rate limiting and DDoS state across instances
- **CORS**: restrict origins to specific domains
- **SSL**: terminate at the load balancer
- **Logs**: aggregate and monitor centrally
- **Alerts**: wire up notifications for critical security events
- **Network layer**: use a CDN with DDoS protection (Cloudflare, AWS CloudFront), network firewalls, geo-IP blocking, and an IDS where appropriate
- **Database**: connection pooling/limits, query logging, prepared statements

### Scalability & Reliability Notes

- Redis-backed rate limiting supports multi-instance deployments
- Guards are stateless for horizontal scaling
- Graceful degradation to in-memory storage when Redis is unavailable
- Circuit-breaker patterns protect against external dependency failures

## Compliance & Standards

Implementation is aligned with:
- OWASP Top 10
- NIST Cybersecurity Framework
- ISO 27001
- PCI DSS (where applicable)

## Possible Future Enhancements

- Machine learning-based threat detection
- External threat intelligence feed integration
- Advanced bot detection / CAPTCHA
- Behavioral analysis and user fingerprinting
- Geographic and ASN-based blocking
- Security orchestration platform integration
