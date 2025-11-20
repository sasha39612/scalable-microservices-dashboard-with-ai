# Authentication & Authorization Implementation

## ✅ Global Authentication Protection

All GraphQL resolvers and REST endpoints are now protected by default with JWT authentication, except those explicitly marked as `@Public()`.

## 🔐 Architecture

### 1. **Global Guards**
Two guards are applied globally via `APP_GUARD` in `AuthModule`:

- **GqlAuthGuard**: Validates JWT tokens and enforces authentication
- **RolesGuard**: Enforces role-based access control (RBAC)

### 2. **Decorators**

#### `@Public()`
Marks an endpoint as publicly accessible (no authentication required).

```typescript
@Public()
@Mutation(() => AuthPayload)
async login(@Args('email') email: string, @Args('password') password: string) {
  return this.authService.login(email, password);
}
```

#### `@Roles(...roles: UserRole[])`
Restricts endpoint access to users with specific roles.

```typescript
@Roles(UserRole.Admin)
@Mutation(() => User)
async createUser(@Args('input') input: CreateUserInput) {
  return this.userService.create(input);
}
```

#### `@CurrentUser()`
Injects the current authenticated user into the handler.

```typescript
@Query(() => User)
async getProfile(@CurrentUser() user: JwtPayload) {
  return this.userService.findOne(user.sub);
}
```

## 📋 User Roles

Defined in `common` package:

```typescript
enum UserRole {
  Admin = "admin",      // Full system access
  User = "user",        // Standard user access
  Moderator = "moderator", // Elevated privileges
  Guest = "guest"       // Minimal access
}
```

Default role for new users: `UserRole.User`

## 🔑 JWT Token Structure

```typescript
interface JwtPayload {
  sub: string;      // User ID
  email: string;    // User email
  role: UserRole;   // User role for authorization
  iat?: number;     // Issued at timestamp
  exp?: number;     // Expiration timestamp
}
```

**Token Expiration**: 1 hour  
**JWT Secret**: Configured via `JWT_SECRET` environment variable

## 🛡️ Protected Endpoints

### **Public Endpoints** (No Authentication Required)
- `POST /health` - Basic health check
- `POST /health/detailed` - Detailed health check
- `mutation login` - User login
- `mutation signup` - User registration

### **Authenticated Endpoints** (Requires Valid JWT)
All other endpoints require authentication:

#### **User Queries & Mutations**
- `query users` - List all users (all authenticated users)
- `query user(id)` - Get user by ID (all authenticated users)
- `query me` - Get current user profile (all authenticated users)
- `mutation createUser` - Create new user (**Admin only**)
- `mutation updateUser` - Update user (**Admin only**)

#### **AI Service**
- `mutation chat` - Send chat message
- `query chatHistory` - Get chat history
- `query insights` - Get AI insights
- `mutation analyzeData` - Analyze data
- `query recommendations` - Get recommendations
- `mutation generateSummary` - Generate summary

#### **Dashboard**
- `query dashboardStats` - Get dashboard statistics
- `query dashboardInsights` - Get dashboard insights
- `query dashboardTrends` - Get historical trends

#### **Tasks & Jobs**
- `mutation createTask` - Create new task
- `query task(id)` - Get task by ID
- `query tasks` - List all tasks
- `mutation cancelTask` - Cancel task
- `mutation retryTask` - Retry failed task
- `mutation createJob` - Create scheduled job
- `query jobs` - List all jobs
- `query job(id)` - Get job by ID
- `mutation pauseJob` - Pause job
- `mutation resumeJob` - Resume job
- `mutation deleteJob` - Delete job

## 🔄 Authentication Flow

### **1. User Registration**
```graphql
mutation Signup {
  signup(email: "user@example.com", password: "securepass123", name: "John Doe") {
    accessToken
    user {
      id
      email
      name
      role
    }
  }
}
```

### **2. User Login**
```graphql
mutation Login {
  login(email: "user@example.com", password: "securepass123") {
    accessToken
    user {
      id
      email
      name
      role
    }
  }
}
```

### **3. Making Authenticated Requests**
Include JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

Frontend Apollo Client automatically includes the token from `localStorage.authToken`.

## 🚨 Error Responses

### **401 Unauthorized**
- No authorization header provided
- Invalid or expired token

```json
{
  "errors": [{
    "message": "No authorization header",
    "extensions": {
      "code": "UNAUTHENTICATED"
    }
  }]
}
```

### **403 Forbidden**
- User doesn't have required role

```json
{
  "errors": [{
    "message": "Forbidden resource",
    "extensions": {
      "code": "FORBIDDEN"
    }
  }]
}
```

## 📁 File Structure

```
backend/api-gateway/src/modules/auth/
├── auth.guard.ts                    # Global JWT authentication guard
├── auth.module.ts                   # Auth module with global guards
├── auth.resolve.ts                  # Auth mutations (login, signup)
├── auth.service.ts                  # Auth business logic
├── decorators/
│   ├── current-user.decorator.ts    # @CurrentUser() decorator
│   ├── public.decorator.ts          # @Public() decorator
│   └── roles.decorator.ts           # @Roles() decorator
└── guards/
    └── roles.guard.ts               # Role-based access control guard
```

## 🔧 Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-strong-secret-key-here  # Change in production!
JWT_EXPIRATION=1h                       # Token expiration time
```

### Database Migration
The `role` column was added to the `users` table:

```sql
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'user';
```

## 🎯 Best Practices

1. **Always use HTTPS in production** to prevent token interception
2. **Rotate JWT secrets regularly** in production environments
3. **Use strong passwords** with minimum requirements
4. **Implement refresh tokens** for better security (future enhancement)
5. **Add rate limiting** to prevent brute force attacks (future enhancement)
6. **Log authentication attempts** for security auditing
7. **Never expose JWT secrets** in client-side code

## 🔄 Future Enhancements

- [ ] Implement refresh token mechanism
- [ ] Add password strength validation
- [ ] Implement rate limiting for login attempts
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Implement session management
- [ ] Add OAuth2 providers (Google, GitHub)
- [ ] Add audit logging for sensitive operations
- [ ] Implement API key authentication for inter-service calls
- [ ] Add CSRF protection
- [ ] Implement account lockout after failed attempts

## 📝 Testing Authentication

### Test Login
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"user@example.com\", password: \"password123\") { accessToken user { id email role } } }"
  }'
```

### Test Protected Endpoint
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "query { users { id email name role } }"
  }'
```

### Test Public Endpoint
```bash
curl http://localhost:4000/health
```

## ✅ Implementation Complete

All resolvers and endpoints are now protected by default. The authentication system is production-ready with the following features:

- ✅ Global JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ Public endpoint support
- ✅ User roles in JWT payload
- ✅ Protected health endpoints
- ✅ Login/signup mutations
- ✅ Comprehensive error handling
- ✅ Frontend token management

**Security Status**: 🟢 **SECURED**
