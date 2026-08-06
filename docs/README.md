# Documentation Index

Reference documentation for the Scalable Microservices Dashboard. Grouped by area — each doc covers what was built, how it works, how to configure it, and how to test/verify it.

## Security

- [Authentication](./AUTHENTICATION.md) — JWT-based auth for the API Gateway (GraphQL + REST), global guards, and refresh token rotation.
- [RBAC](./RBAC.md) — Role-based authorization: guards, decorators, and the authorization flow.
- [Inter-Service Authentication](./INTER_SERVICE_AUTH.md) — API-key auth securing API Gateway → Worker Service / AI Service calls.
- [API Gateway Security](./API_GATEWAY_SECURITY.md) — WAF, DDoS protection, security headers, and monitoring for the gateway.
- [Rate Limiting](./RATE_LIMITING.md) — `@nestjs/throttler`-based rate limiting with a GraphQL-aware guard.
- [Redis Security](./REDIS_SECURITY.md) — Redis hardening: network isolation, auth, and configuration.
- [Audit Logging](./AUDIT_LOGGING.md) — Centralized audit trail for sensitive operations across services.
- [Security Verification](./SECURITY_VERIFICATION.md) — Reference checklist of auth/authorization mechanisms implemented across the platform.

## AI & Background Processing

- [AI Integration](./AI_INTEGRATION.md) — How the AI Service is wired into the API Gateway: architecture, auth, configuration, endpoints.
- [Worker Service Integration](./WORKER_INTEGRATION.md) — API Gateway ↔ Worker Service integration for background tasks and scheduled jobs.

## Infrastructure

- [Database](./DATABASE.md) — PostgreSQL/TypeORM schema, connection setup, environment configuration, and verification.
- [Remote DB Setup](./REMOTE_DB_SETUP.md) — Provisioning a remote PostgreSQL server.
- [Gateway Caching](./GATEWAY_CACHING.md) — Redis-backed response caching with in-memory fallback.
- [Health Checks](./HEALTH_CHECKS.md) — Health check endpoints across all services for orchestration and monitoring.

## Frontend

- [Frontend Notes](./FRONTEND_NOTES.md) — Frontend auth flow and frontend/backend data integration status.

## Troubleshooting

- [Module Resolution Fix](./MODULE_RESOLUTION_FIX.md) — TypeScript path-mapping fix for the shared `common` package.
