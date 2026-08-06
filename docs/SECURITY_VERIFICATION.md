# Security Verification

Reference checklist of authentication/authorization mechanisms implemented across the platform.

## 1. Global Authentication (JWT)

`GqlAuthGuard` (`backend/api-gateway/src/modules/auth/auth.guard.ts`) is registered globally via `APP_GUARD` in `auth.module.ts`. It validates JWTs from the `Authorization: Bearer <token>` header, attaches the user to the request context, and supports a `@Public()` opt-out.

```typescript
@Injectable()
export class GqlAuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

### Protected Endpoints

| Resolver | Method | Protection |
|----------|--------|------------|
| UserResolver | `user()` | JWT Required |
| UserResolver | `users()` | JWT + Admin |
| UserResolver | `updateUser()` | JWT + Owner/Admin |
| UserResolver | `deleteUser()` | JWT + Admin |
| AuthResolver | `login()` | Public |
| AuthResolver | `register()` | Public |
| AuthResolver | `me()` | JWT Required |
| WorkerResolver | `createTask()` / `getTasks()` / `cancelTask()` | JWT Required |
| AIResolver | `chat()` / `getInsights()` | JWT Required |
| HealthResolver | `health()` | Public |

Decorators: `@Public()`, `@CurrentUser()`, `@Roles()` — in `backend/api-gateway/src/modules/auth/decorators/`.

## 2. Role-Based Authorization

`RolesGuard` (`backend/api-gateway/src/modules/auth/guards/roles.guard.ts`) is also registered globally via `APP_GUARD`, runs after `GqlAuthGuard`, and validates the role on the JWT payload. See `docs/RBAC.md` for full implementation detail.

```typescript
export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Moderator = 'moderator',
  Guest = 'guest',
}
```

Default role: `UserRole.User`. Role is included in the JWT payload (`backend/api-gateway/src/modules/auth/auth.service.ts`):

```typescript
const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
};
```

| Endpoint | Required Role |
|----------|---------------|
| `users()` | Admin |
| `deleteUser()` | Admin |
| `updateUser()` | Admin or Owner |
| `createTask()` / `getTasks()` / `chat()` | User+ |

## 3. Inter-Service Authentication

Worker Service (`backend/worker-service/src/guards/api-key.guard.ts`) and AI Service (`backend/ai-service/src/guards/api-key.guard.ts`) both validate an `X-API-Key` header, returning 401 if missing/invalid, and support `@Public()` for exceptions.

- `WorkerClient` (`backend/api-gateway/src/services/worker.client.ts`) — `apiKey` property + `getHeaders()` helper; all 12 fetch calls send `X-API-Key`.
- `AIClient` (`backend/api-gateway/src/services/ai.client.ts`) — same pattern; all 9 fetch calls send `X-API-Key`.

Required env vars:
```env
WORKER_SERVICE_API_KEY=<secure-random-key>
AI_SERVICE_API_KEY=<secure-random-key>
```

Health checks (`GET /health` on both services) remain public. Covered by `scripts/test-inter-service-auth.sh`, which checks: reject missing key (401), reject invalid key (401), accept valid key (200/201), health stays public (200).

## 4. Password Security

bcrypt with 10 salt rounds; plaintext passwords are never stored (`backend/api-gateway/src/modules/auth/auth.service.ts`):

```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

Login uses `bcrypt.compare()` (constant-time, timing-attack resistant).

## 5. JWT Configuration

```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '1h' },
})
```

Secret from env, 1-hour expiry, HS256 signing. Signature and expiration are verified on every request; invalid tokens get 401.

## 6. GraphQL Security — Outstanding

- Introspection should be disabled in production: `introspection: process.env.NODE_ENV !== 'production'`.
- No query complexity or depth limits yet.
- No rate limiting yet.

## 7. Environment Variables

Secrets (`JWT_SECRET`, `DATABASE_PASSWORD`, `WORKER_SERVICE_API_KEY`, `AI_SERVICE_API_KEY`) live in env vars. `.env` is gitignored; `.env.example` documents the keys without values; Docker Compose reads from `.env`.

## 8. HTTPS/TLS — Outstanding

Development runs over HTTP. For production: terminate TLS at the load balancer (e.g. Let's Encrypt certs), force HTTPS redirects, set HSTS headers.

## 9. CORS

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
})
```

Origin restricted to the frontend URL (configurable), credentials allowed. `backend/api-gateway/src/main.ts`.

## 10. Error Handling

Generic error messages returned to clients; detailed errors go to logs only; no stack traces in production responses; 401 for authn failures, 403 for authz failures.

## Test Scripts

- `scripts/test-health-checks.sh`
- `scripts/test-user-creation.sh`
- `scripts/test-ai-gateway-integration.sh`
- `scripts/test-worker-gateway-integration.sh`
- `scripts/test-inter-service-auth.sh`

Manual checklist worth re-running after auth changes: login success/failure, protected endpoint without token (401), expired token (401), admin endpoint as regular user (403) and as admin (success), inter-service call without/with API key, health endpoints without auth.

## Current Gaps for Production Hardening

- [ ] Enable HTTPS/TLS
- [ ] Disable GraphQL introspection
- [ ] Rate limiting
- [ ] Query complexity/depth limits
- [ ] Request logging/monitoring, audit logging
- [ ] CSRF protection
- [ ] Security headers (helmet)
- [ ] Refresh tokens
- [ ] MFA
- [ ] Regular security audits, dependency scanning, penetration testing, key rotation policy
