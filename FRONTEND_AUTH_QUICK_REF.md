# Frontend Authentication - Quick Reference

## Overview
Full authentication system implemented with JWT tokens, login/register pages, and protected routes.

## Key Files Created

### 1. AuthContext (`frontend/contexts/AuthContext.tsx`)
- Manages authentication state globally
- Provides `useAuth()` hook for accessing user, token, login, register, logout
- Automatically verifies stored tokens on page load
- Stores JWT tokens in localStorage

### 2. Login Page (`frontend/app/login/page.tsx`)
- Email/password login form
- Error handling and loading states
- Redirects to dashboard on success
- Link to registration page

### 3. Register Page (`frontend/app/register/page.tsx`)
- User registration with name, email, password
- Password confirmation validation
- Minimum 8 character password requirement
- Automatic login after registration

### 4. ProtectedRoute Component (`frontend/components/ProtectedRoute.tsx`)
- Wraps authenticated pages
- Redirects to /login if not authenticated
- Shows loading spinner while checking auth
- Stores return URL for post-login redirect

### 5. Updated Files
- **`frontend/app/layout.tsx`**: Wrapped with AuthProvider
- **`frontend/components/layout/Navbar.tsx`**: Shows user info and logout button
- **`frontend/utils/apollo-client.ts`**: Reads token from localStorage for GraphQL requests
- **Protected pages**: dashboard, analytics, tasks, ai-chat, profile

## Usage

### Accessing Auth State
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, token, login, logout, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

### Protecting a Page
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function SecurePage() {
  return (
    <ProtectedRoute>
      <div>This content requires authentication</div>
    </ProtectedRoute>
  );
}
```

### Manual Login
```typescript
const { login } = useAuth();

try {
  await login('user@example.com', 'password123');
  // Redirect or show success
} catch (error) {
  // Show error message
}
```

### Logout
```typescript
const { logout } = useAuth();

logout(); // Clears token and redirects to /login
```

## Authentication Flow

### 1. Initial Load
```
App starts → AuthProvider checks localStorage
  ├─ Token found → Verify with backend → Set user state
  └─ No token → User remains null
```

### 2. Login Flow
```
User enters credentials → Submit to /api/graphql
  ├─ Success → Store token → Set user → Redirect to dashboard
  └─ Error → Show error message
```

### 3. Protected Route Access
```
User navigates to protected page → ProtectedRoute checks auth
  ├─ Authenticated → Render page
  └─ Not authenticated → Redirect to /login
```

### 4. GraphQL Requests
```
Apollo Client makes request → authLink adds token
  ├─ Token exists → Add Authorization header
  └─ No token → Send without auth (public endpoints only)
```

## API Endpoints Used

### Register
```graphql
mutation Register($email: String!, $password: String!, $name: String!) {
  register(email: $email, password: $password, name: $name) {
    access_token
    user {
      id
      email
      name
      role
    }
  }
}
```

### Login
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    access_token
    user {
      id
      email
      name
      role
    }
  }
}
```

### Verify Token
```graphql
query VerifyToken {
  verifyToken {
    id
    email
    name
    role
  }
}
```

## User Object Structure
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
```

## Token Storage
- Stored in: `localStorage` with key `authToken`
- Format: JWT string
- Sent as: `Authorization: Bearer <token>`
- Cleared on: Logout or invalid token

## Navigation Behavior
- Login/Register pages: Navbar hidden
- Protected pages: Require authentication
- Logout: Clears state and redirects to /login
- After login: Redirects to stored URL or /dashboard

## Testing

### Create Test User (Backend)
```bash
# Use GraphQL playground at http://localhost:4000/graphql
mutation {
  register(
    email: "test@example.com"
    password: "password123"
    name: "Test User"
  ) {
    access_token
    user {
      id
      email
      name
    }
  }
}
```

### Test Login (Frontend)
1. Navigate to http://localhost:3000/login
2. Enter test credentials
3. Should redirect to /dashboard
4. Check localStorage for `authToken`
5. All GraphQL requests now include Authorization header

## Common Issues

### Token Not Being Sent
- Check browser localStorage has `authToken`
- Verify Apollo Client authLink is configured
- Check browser Network tab for Authorization header

### Redirect Loop
- Clear localStorage
- Check ProtectedRoute logic
- Verify token is valid on backend

### 401 Errors
- Token expired or invalid
- Logout and login again
- Check backend JWT configuration

## Security Notes
- ⚠️ **Development Mode**: Tasks and AI endpoints currently have `@Public()` decorator
- 🔐 **Production**: Remove `@Public()` decorators before deployment
- 🔑 **Token Storage**: localStorage is used (consider httpOnly cookies for production)
- 🛡️ **HTTPS**: Always use HTTPS in production
- ⏰ **Token Expiry**: Implement token refresh mechanism for production

## Next Steps for Production
1. Remove `@Public()` from backend resolvers
2. Implement token refresh mechanism
3. Add password reset functionality
4. Implement email verification
5. Add remember me functionality
6. Use httpOnly cookies instead of localStorage
7. Add CSRF protection
8. Implement rate limiting on auth endpoints
9. Add 2FA support
10. Implement session management
