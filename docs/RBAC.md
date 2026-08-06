# Role-Based Authorization (RBAC)

## Components

### RolesGuard

`backend/api-gateway/src/modules/auth/guards/roles.guard.ts`

Implements `CanActivate`, reads role metadata via `Reflector` (checking both handler and class level), extracts the user from the GraphQL context, and allows access if no roles are required (defaults to authenticated-only).

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
```

### @Roles() Decorator

`backend/api-gateway/src/modules/auth/decorators/roles.decorator.ts` — attaches role metadata via `SetMetadata`, accepts multiple roles (OR logic), type-safe against the `UserRole` enum from the `common` package.

```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### Global Registration

`backend/api-gateway/src/modules/auth/auth.module.ts` registers `RolesGuard` as a global guard via `APP_GUARD`, applied after `GqlAuthGuard` so authentication runs before authorization.

### User Roles

```typescript
enum UserRole {
  Admin = "admin",
  User = "user",
  Moderator = "moderator",
  Guest = "guest",
}
```

Default role for new users: `UserRole.User` (set on the User entity, `backend/api-gateway/src/modules/user/user.entity.ts`).

JWT payload includes the role: `{ sub: user.id, email: user.email, role: user.role }`.

Database schema:
```sql
ALTER TABLE users
ADD COLUMN role VARCHAR(20) DEFAULT 'user'
CHECK (role IN ('admin', 'user', 'moderator', 'guest'));
```

## Authorization Flow

```
Request → GqlAuthGuard → RolesGuard → Handler
            ↓              ↓
         JWT Valid?   Has Role?
            ↓              ↓
          req.user    Allow/Deny
```

1. `GqlAuthGuard` validates the JWT.
2. The JWT payload (with role) is attached to `req.user`.
3. `RolesGuard` checks role requirements.
4. Access is allowed or denied based on the user's role.

## Usage

```typescript
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'common';

// Single role
@Roles(UserRole.Admin)
@Mutation(() => User)
async createUser(@Args('input') input: CreateUserInput) {
  return this.userService.create(input);
}

// Multiple roles (OR logic)
@Roles(UserRole.Admin, UserRole.Moderator)
@Mutation(() => User)
async updateUser(@Args('input') input: UpdateUserInput) {
  return this.userService.update(input);
}

// No @Roles() → authenticated users only
@Query(() => [User], { name: 'users' })
getUsers() {
  return this.userService.findAll();
}
```

Checking role in resolver code:

```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload, UserRole } from 'common';

@Query(() => String)
getUserSpecificData(@CurrentUser() user: JwtPayload) {
  if (user.role === UserRole.Admin) {
    // Admin-specific logic
  }
  return `Data for ${user.email}`;
}
```

## Protection Matrix

| Endpoint | Authentication | Role Required | Who Can Access |
|----------|---------------|---------------|----------------|
| `login` | Public | None | Everyone |
| `signup` | Public | None | Everyone |
| `users` | Required | None* | Any authenticated user |
| `user(id)` | Required | None | Any authenticated user |
| `createUser` | Required | Admin | Admins only |
| `updateUser` | Required | Admin | Admins only |
| `chat` | Required | None | Any authenticated user |
| `dashboardStats` | Required | None | Any authenticated user |
| `createTask` | Required | None | Any authenticated user |

\* Note: `docs/SECURITY_VERIFICATION.md`'s protection table marks `users()` as Admin-only — check `user.resolver.ts` directly for the current `@Roles()` annotation on that query if this matters for a change.

## Error Responses

```json
// 403 Forbidden — insufficient role
{
  "errors": [{
    "message": "Forbidden resource",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

```json
// 401 Unauthorized — not authenticated
{
  "errors": [{
    "message": "No authorization header",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```
