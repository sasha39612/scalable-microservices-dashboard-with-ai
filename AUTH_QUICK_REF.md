# Authentication Quick Reference

## 🔐 Mark Endpoint as Public

```typescript
import { Public } from './modules/auth/decorators/public.decorator';

@Public()
@Query(() => String)
publicEndpoint() {
  return 'This is public';
}
```

## 🛡️ Restrict to Specific Roles

```typescript
import { Roles } from './modules/auth/decorators/roles.decorator';
import { UserRole } from 'common';

@Roles(UserRole.Admin)
@Mutation(() => User)
adminOnlyEndpoint() {
  return 'Admin only';
}

// Multiple roles
@Roles(UserRole.Admin, UserRole.Moderator)
@Mutation(() => User)
moderatorOrAdminEndpoint() {
  return 'Admin or Moderator only';
}
```

## 👤 Get Current User

```typescript
import { CurrentUser } from './modules/auth/decorators/current-user.decorator';
import { JwtPayload } from 'common';

@Query(() => User)
getMyProfile(@CurrentUser() user: JwtPayload) {
  return this.userService.findOne(user.sub);
}
```

## 📝 Default Behavior

- **All endpoints require authentication by default**
- Mark with `@Public()` to allow unauthenticated access
- Use `@Roles()` for additional role-based restrictions

## 🔑 GraphQL Mutations

### Login
```graphql
mutation {
  login(email: "user@example.com", password: "password") {
    accessToken
    user { id email name role }
  }
}
```

### Signup
```graphql
mutation {
  signup(email: "user@example.com", password: "password", name: "John") {
    accessToken
    user { id email name role }
  }
}
```

## 📦 Frontend Usage

```typescript
// Apollo Client automatically includes token from localStorage.authToken
localStorage.setItem('authToken', response.data.login.accessToken);
```

## 🚨 Common Errors

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User lacks required role
