# API Gateway Security Implementation

This document provides a comprehensive overview of the security features implemented in the API Gateway, including rate limiting, DDoS protection, and Web Application Firewall (WAF) capabilities.

## 🛡️ Security Features Overview

### 1. Web Application Firewall (WAF)
**Location**: `src/guards/waf.guard.ts`

The WAF provides protection against common web vulnerabilities:

#### Protected Attack Vectors:
- **SQL Injection**: Pattern-based detection of SQL injection attempts
- **XSS Attacks**: Cross-site scripting protection with HTML/JavaScript pattern detection
- **Path Traversal**: Detection of directory traversal attempts (`../`, `..\\`, etc.)
- **Command Injection**: Protection against OS command injection
- **LDAP Injection**: LDAP query injection protection
- **NoSQL Injection**: MongoDB and NoSQL injection protection

#### Features:
- Request body, query parameters, and headers scanning
- URL encoding and HTML entity decoding
- Suspicious file upload detection
- Request size limits
- Configurable per-route via `@DisableWaf()` decorator

### 2. DDoS Protection
**Location**: `src/guards/ddos-protection.guard.ts`

Comprehensive DDoS protection system with multiple detection mechanisms:

#### Protection Mechanisms:
- **Connection Rate Limiting**: Max concurrent connections per IP
- **Request Rate Analysis**: Pattern-based request frequency monitoring
- **Behavioral Analysis**: Bot detection and suspicious activity identification
- **Geographic Anomaly Detection**: IP-based location analysis
- **Distributed Attack Detection**: Coordinated attack pattern recognition

#### Configuration:
- Max concurrent connections: 100 per IP
- Rate limit: 300 requests/minute per IP
- Suspicious threshold: 200 requests/minute
- Automatic IP blacklisting for persistent attackers

### 3. Enhanced Rate Limiting
**Location**: `src/config/rate-limit.config.ts`, `src/middleware/rate-limiting.middleware.ts`

Multi-tier rate limiting system with Redis support:

#### Rate Limiting Tiers:
- **Short-term**: 1-second windows for burst protection
- **Medium-term**: 1-minute windows for standard protection
- **Long-term**: 1-hour windows for abuse prevention
- **Daily**: 24-hour windows for quota management

#### Endpoint-Specific Limits:
- **Authentication**: 3 requests/minute (brute force protection)
- **AI Operations**: 5-200 requests/hour (resource management)
- **File Uploads**: 5-100 requests/hour (abuse prevention)
- **Admin Operations**: Strict limits with monitoring

#### Features:
- Redis-backed storage for distributed environments
- User-based rate limiting (anonymous vs authenticated)
- Context-aware limits based on user roles
- Graceful degradation to in-memory storage

### 4. Security Headers
**Location**: `src/middleware/security-headers.middleware.ts`

Comprehensive HTTP security headers using Helmet.js:

#### Implemented Headers:
- **Content Security Policy (CSP)**: XSS protection
- **HTTP Strict Transport Security (HSTS)**: HTTPS enforcement
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing protection
- **Referrer Policy**: Information leakage prevention
- **Permissions Policy**: Feature access control

### 5. Security Monitoring & Alerting
**Location**: `src/middleware/security-monitoring.middleware.ts`

Real-time security event monitoring and analysis:

#### Monitoring Capabilities:
- **Threat Detection**: Pattern-based attack identification
- **Event Logging**: Comprehensive security event tracking
- **Severity Classification**: LOW, MEDIUM, HIGH, CRITICAL levels
- **Real-time Alerting**: Immediate notification for critical events
- **Analytics Dashboard**: Security metrics and trend analysis

#### Event Types:
- WAF blocks
- DDoS attacks
- Rate limit violations
- Authentication failures
- Suspicious activities

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# Redis (for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Security
NODE_ENV=production
```

### Security Module Integration

The security features are integrated through the `SecurityModule`:

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

## 🎯 Usage Examples

### Applying Custom Rate Limits

```typescript
@Resolver()
export class AuthResolver {
  @Mutation(() => LoginResponse)
  @Throttle(RateLimits.LOGIN) // 3 attempts per minute
  async login(@Args('input') input: LoginInput): Promise<LoginResponse> {
    // Login implementation
  }
}
```

### Disabling Security for Specific Routes

```typescript
@Controller('uploads')
export class FileController {
  @Post()
  @DisableWaf() // Disable WAF for file uploads
  @Throttle(RateLimits.FILE_UPLOAD)
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // File upload implementation
  }
}
```

### Role-based Rate Limiting

```typescript
@Get('data')
@UseGuards(JwtAuthGuard)
@Throttle(UserBasedLimits.AUTHENTICATED) // Higher limits for authenticated users
async getData() {
  // Data retrieval implementation
}
```

## 📊 Monitoring & Analytics

### Security Dashboard Endpoints

```bash
# Security health check
GET /security/health

# Comprehensive security statistics
GET /security/stats

# Security report generation
GET /security/report?hours=24

# Real-time metrics
GET /security/metrics

# Security recommendations
GET /security/recommendations
```

### Security Management Endpoints

```bash
# Blacklist an IP address
POST /security/blacklist
{
  "ip": "192.168.1.100",
  "reason": "Persistent brute force attacks"
}

# Remove from blacklist
POST /security/whitelist
{
  "ip": "192.168.1.100",
  "reason": "False positive resolved"
}
```

## 🚨 Security Events & Alerting

### Event Types and Severity Levels

| Event Type | Severity | Description |
|------------|----------|-------------|
| WAF_BLOCK | HIGH | Web application firewall blocked request |
| DDOS_BLOCK | CRITICAL | DDoS protection blocked request |
| RATE_LIMIT | MEDIUM | Rate limiting triggered |
| SUSPICIOUS_ACTIVITY | VARIABLE | Unusual behavior detected |
| AUTH_FAILURE | LOW-HIGH | Authentication attempt failed |

### Alert Configuration

Critical events (CRITICAL severity) trigger immediate alerts:
- Console warnings with detailed information
- Structured logging for SIEM integration
- Configurable webhook notifications
- Integration ready for email/Slack/PagerDuty

## 🔍 GraphQL Security

### Query Complexity Limiting
- Maximum query depth: 10 levels
- Complexity scoring for resource-intensive operations
- Automatic query rejection for excessive complexity

### Authentication Integration
```typescript
@Query(() => [User])
@UseGuards(JwtAuthGuard)
@Throttle(RateLimits.USER)
async users(): Promise<User[]> {
  // Implementation
}
```

## 🏗️ Architecture Considerations

### Scalability
- Redis-backed rate limiting for multi-instance deployments
- Stateless security guards for horizontal scaling
- Efficient in-memory caching with cleanup mechanisms

### Performance
- Optimized pattern matching for WAF rules
- Asynchronous security event processing
- Minimal overhead through selective rule application

### Reliability
- Graceful degradation when Redis is unavailable
- Circuit breaker patterns for external dependencies
- Comprehensive error handling and logging

## 🛠️ Customization

### Adding Custom WAF Rules

```typescript
// Add to src/guards/waf.guard.ts
private readonly customPatterns = [
  /your-custom-pattern/gi,
];
```

### Configuring Custom Rate Limits

```typescript
// Add to src/config/rate-limit.config.ts
export const CustomRateLimits = {
  YOUR_ENDPOINT: {
    short: { limit: 10, ttl: 60000 },
    medium: { limit: 50, ttl: 300000 },
  },
};
```

### Security Event Handlers

```typescript
// Implement custom security event handling
class CustomSecurityHandler {
  handleSecurityEvent(event: SecurityEvent) {
    // Custom logic for security events
    if (event.severity === 'CRITICAL') {
      this.sendSlackAlert(event);
    }
  }
}
```

## 📋 Best Practices

### Implementation Guidelines
1. **Always test security changes in staging** before production deployment
2. **Monitor security metrics** regularly for anomalies
3. **Keep security patterns updated** based on threat intelligence
4. **Use role-based access control** for security management endpoints
5. **Implement proper logging** for compliance and audit requirements

### Performance Optimization
1. **Use Redis** for distributed rate limiting in production
2. **Configure appropriate cleanup intervals** for memory management
3. **Monitor resource usage** and adjust limits accordingly
4. **Implement caching** for frequently accessed security data

### Security Hardening
1. **Regular security audits** of WAF rules and rate limits
2. **IP whitelist management** for trusted sources
3. **Automated threat intelligence** integration
4. **Regular security testing** and penetration testing

## 🔐 Compliance & Standards

This implementation follows security best practices from:
- OWASP Top 10 Web Application Security Risks
- NIST Cybersecurity Framework
- ISO 27001 Information Security Management
- PCI DSS (where applicable)

## 📚 Additional Resources

- [OWASP Web Application Firewall](https://owasp.org/www-community/Web_Application_Firewall)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [DDoS Protection Best Practices](https://aws.amazon.com/shield/ddos-attack-protection/)
- [Security Headers Reference](https://securityheaders.com/)

---

**Note**: This security implementation provides a strong foundation but should be regularly updated based on evolving threats and security requirements. Always conduct security assessments before deploying to production.