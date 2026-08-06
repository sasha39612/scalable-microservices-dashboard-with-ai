# Authentication

JWT-based authentication for the API Gateway (GraphQL + REST), with global guards,
role-based access control, and refresh token rotation.

## Overview

- All GraphQL resolvers and REST endpoints are protected by default via global guards.
- Endpoints opt out of auth explicitly with `@Public()`.
- Role restrictions are applied with `@Roles(...)`.
- Access tokens are short-lived; refresh tokens are long-lived, hashed at rest, and rotated on use.

## Architecture

### Global Guards

Registered via `APP_GUARD` in `AuthModule` (`backend/api-gateway/src/modules/auth/auth.module.ts`):

- **`GqlAuthGuard`** - validates the JWT access token and enforces authentication. Reads `@Public()` metadata via `Reflector` to skip enforcement where marked.
- **`RolesGuard`** - enforces role-based access control based on `@Roles()` metadata.

### Decorators

| Decorator | Location | Purpose |
|---|---|---|
| `@Public()` | `decorators/public.decorator.ts` | Marks an endpoint as publicly accessible (bypasses auth) |
| `@Roles(...roles: UserRole[])` | `decorators/roles.decorator.ts` | Restricts endpoint to specific user roles |
| `@CurrentUser()` | `decorators/current-user.decorator.ts` | Injects the authenticated user (JWT payload) into the handler |

```typescript
@Public()
@Mutation(() => AuthPayload)
async login(@Args('email') email: string, @Args('password') password: string) {
  return this.authService.login(email, password);
}

@Roles(UserRole.Admin)
@Mutation(() => User)
async createUser(@Args('input') input: CreateUserInput) {
  return this.userService.create(input);
}

@Query(() => User)
async getProfile(@CurrentUser() user: JwtPayload) {
  return this.userService.findOne(user.sub);
}
```

Default behavior: **every new endpoint is protected unless explicitly marked `@Public()`.**

### User Roles

```typescript
enum UserRole {
  Admin = "admin",         // Full system access
  User = "user",           // Standard user access
  Moderator = "moderator", // Elevated privileges
  Guest = "guest"          // Minimal access
}
```

Default role for new users: `UserRole.User`. Persisted as `role VARCHAR(20) DEFAULT 'user'` on the `users` table.

### File Structure

```
backend/api-gateway/src/modules/auth/
├── auth.guard.ts                    # Global JWT authentication guard
├── auth.module.ts                   # Auth module, global guard registration, JWT config validation
├── auth.resolve.ts                  # GraphQL mutations (login, signup, refreshToken, logout)
├── auth.service.ts                  # Auth business logic, token issuance/validation
├── decorators/
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   └── roles.decorator.ts
└── guards/
    └── roles.guard.ts
```

## Authentication Flows

### Registration

```graphql
mutation Signup {
  signup(email: "user@example.com", password: "securepass123", name: "John Doe") {
    accessToken
    refreshToken
    user { id email name role }
  }
}
```

### Login

```graphql
mutation Login {
  login(email: "user@example.com", password: "securepass123") {
    accessToken
    refreshToken
    user { id email name role }
  }
}
```

### Refresh

```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    accessToken
    refreshToken
    user { id email name role }
  }
}
```

### Logout

```graphql
mutation Logout($userId: String!) {
  logout(userId: $userId)
}
```

### Authenticated Requests

```
Authorization: Bearer <access_token>
```

The frontend Apollo Client automatically attaches the token from `localStorage.accessToken` (formerly `authToken`).

### Token Refresh Flow (client-side)

```
Login → receive access + refresh token
  ↓
Use access token (15m)
  ↓
Access token expires → call refreshToken mutation
  ↓
Receive new token pair → continue
  ↓
Logout → refresh token invalidated server-side
```

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            accessToken
            refreshToken
          }
        }
      `,
      variables: { refreshToken }
    })
  });

  const data = await response.json();

  if (data.data?.refreshToken) {
    localStorage.setItem('accessToken', data.data.refreshToken.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken.refreshToken);
    return data.data.refreshToken.accessToken;
  }

  // Refresh failed, force logout
  localStorage.clear();
  window.location.href = '/login';
}

async function logout(userId: string) {
  const accessToken = localStorage.getItem('accessToken');

  await fetch('/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `mutation Logout($userId: String!) { logout(userId: $userId) }`,
      variables: { userId }
    })
  });

  localStorage.clear();
  window.location.href = '/login';
}
```

## JWT Details

### Token Structure

```typescript
interface JwtPayload {
  sub: string;      // User ID
  email: string;    // User email
  role: UserRole;   // User role, used by RolesGuard
  iat?: number;     // Issued at
  exp?: number;     // Expiration
}
```

### Access vs. Refresh Tokens

| | Access Token | Refresh Token |
|---|---|---|
| Lifetime (default) | 15 minutes | 7 days |
| Secret | `JWT_ACCESS_SECRET` | `JWT_REFRESH_SECRET` (different value) |
| Storage | Client memory/localStorage | Client localStorage; hashed copy in DB |
| Validation | Signature + expiry | Signature + expiry + hash match against DB |

### Security Features

- **Separate secrets** for access and refresh tokens — independent validation, no shared blast radius.
- **No default/fallback secret.** The old hardcoded `'supersecret'` fallback has been removed; startup validation requires real secrets to be configured, with strict enforcement in production and warnings in development.
- **Refresh tokens are hashed** (bcrypt, 10 rounds) before being stored in the database — the raw token is never persisted.
- **One active refresh token per user**, replaced (rotated) on every successful refresh — old token is invalidated, mitigating replay attacks.
- **Logout invalidates** the stored refresh token immediately.

## Configuration

### Environment Variables

```bash
# Required in production (no fallback allowed)
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-64>
JWT_REFRESH_SECRET=<different-value-generated-the-same-way>

# Optional (defaults shown)
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

Generate secrets:

```bash
openssl rand -base64 64   # access secret
openssl rand -base64 64   # refresh secret (must differ from access secret)
```

For production deployment, also update:
- `.env.example` (documented, not committed values)
- `k8s/config.yaml`
- Kubernetes secret:
  ```bash
  kubectl create secret generic jwt-secrets \
    --from-literal=access-secret=$JWT_ACCESS_SECRET \
    --from-literal=refresh-secret=$JWT_REFRESH_SECRET
  ```

### Database

`refreshToken` column added to the `users` table. Migration at
`backend/api-gateway/migrations/add-refresh-token.sql`:

```bash
psql $DATABASE_URL -f backend/api-gateway/migrations/add-refresh-token.sql
```

In development with TypeORM `synchronize: true`, the schema updates automatically.

## Endpoints

### Public (No Authentication Required)

| Endpoint | Type | Notes |
|---|---|---|
| `login(email, password)` | Mutation | Returns access + refresh token, user |
| `signup(email, password, name)` | Mutation | Creates user, returns access + refresh token |
| `/health` | REST | Basic health check |
| `/health/detailed` | REST | Detailed service health |

### Authenticated (Valid Access Token Required)

| Area | Endpoints |
|---|---|
| User | `users`, `user(id)`, `me` (all authenticated); `createUser`, `updateUser` (**Admin only**) |
| AI | `chat`, `chatHistory`, `insights`, `analyzeData`, `recommendations`, `generateSummary` |
| Dashboard | `dashboardStats`, `dashboardInsights`, `dashboardTrends` |
| Tasks/Jobs | `createTask`, `task(id)`, `tasks`, `cancelTask`, `retryTask`, `createJob`, `jobs`, `job(id)`, `pauseJob`, `resumeJob`, `deleteJob` |
| Session | `refreshToken(refreshToken)`, `logout(userId)` |

### Error Responses

**401 Unauthorized** — missing/invalid/expired access token:

```json
{
  "errors": [{
    "message": "No authorization header",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

**403 Forbidden** — authenticated but missing required role:

```json
{
  "errors": [{
    "message": "Forbidden resource",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

## Developer Guide: Adding New Endpoints

```typescript
// Protected by default — no decorator needed
@Query(() => String)
myNewEndpoint() {
  return 'Protected by default';
}

// Explicitly public
@Public()
@Query(() => String)
myPublicEndpoint() {
  return 'Accessible without authentication';
}

// Role-restricted
@Roles(UserRole.Admin)
@Mutation(() => String)
adminOnlyEndpoint() {
  return 'Only admins can access';
}

// Multiple roles
@Roles(UserRole.Admin, UserRole.Moderator)
@Mutation(() => User)
moderatorOrAdminEndpoint() {
  return 'Admin or Moderator only';
}
```

## Testing

### Login

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation{login(email:\"user@example.com\",password:\"pass\"){accessToken refreshToken user{id email role}}}"}'
```

### Access a protected endpoint

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"query":"query{users{id email name role}}"}'
```

### Refresh tokens

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation{refreshToken(refreshToken:\"<refresh_token>\"){accessToken refreshToken}}"}'
```

### Logout

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"query":"mutation{logout(userId:\"<user_id>\")}"}'
```

### Public endpoint (health check)

```bash
curl http://localhost:4000/health
```

### Expected behaviors

1. No token on a protected endpoint → `401 Unauthorized`
2. Invalid/expired token on a protected endpoint → `401 Unauthorized`
3. Valid token on a protected endpoint → success
4. No token on a public endpoint → success
5. Non-admin token on an admin-only endpoint → `403 Forbidden`
6. Admin token on an admin-only endpoint → success

## Best Practices

- Always use HTTPS in production to prevent token interception.
- Rotate JWT secrets periodically; never reuse the access secret as the refresh secret.
- Never expose JWT secrets in client-side code.
- Enforce strong password requirements at signup.
- Log authentication attempts and refresh/logout events for auditing.

## Known Gaps / Future Work

- Token blacklisting for immediate revocation
- Device/session tracking
- Rate limiting on login and refresh endpoints
- IP validation for refresh tokens
- Refresh token families for breach detection
- 2FA support
- OAuth2 providers (Google, GitHub)
- CSRF protection for refresh flow
- Account lockout after repeated failed login attempts
