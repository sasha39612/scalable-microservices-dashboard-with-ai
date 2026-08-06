# Frontend Notes

## Authentication

JWT-based auth with login/register pages and protected routes.

### Key Files

| File | Purpose |
|------|---------|
| `frontend/contexts/AuthContext.tsx` | Global auth state; `useAuth()` hook for user, token, login, register, logout; verifies stored token on load |
| `frontend/app/login/page.tsx` | Email/password login form |
| `frontend/app/register/page.tsx` | Registration with name/email/password, min 8-char password, auto-login after registration |
| `frontend/components/ProtectedRoute.tsx` | Wraps authenticated pages, redirects to `/login` if unauthenticated, preserves return URL |
| `frontend/app/layout.tsx` | Wrapped with `AuthProvider` |
| `frontend/components/layout/Navbar.tsx` | Shows user info and logout button |
| `frontend/utils/apollo-client.ts` | Reads token from `localStorage` for GraphQL requests |

Protected pages: dashboard, analytics, tasks, ai-chat, profile.

### Usage

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, token, login, logout, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

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

```typescript
const { login } = useAuth();
await login('user@example.com', 'password123');

const { logout } = useAuth();
logout(); // Clears token and redirects to /login
```

### Auth Flow

1. **Initial load** — `AuthProvider` checks `localStorage`; if a token exists it's verified with the backend to set user state, otherwise user stays `null`.
2. **Login** — credentials submitted to `/api/graphql`; on success the token is stored, user set, and app redirects to dashboard.
3. **Protected route access** — `ProtectedRoute` checks auth state and either renders the page or redirects to `/login`.
4. **GraphQL requests** — Apollo's `authLink` attaches `Authorization: Bearer <token>` when a token is present.

### GraphQL Operations

```graphql
mutation Register($email: String!, $password: String!, $name: String!) {
  register(email: $email, password: $password, name: $name) {
    access_token
    user { id email name role }
  }
}

mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    access_token
    user { id email name role }
  }
}

query VerifyToken {
  verifyToken { id email name role }
}
```

`User` shape: `{ id: string; email: string; name: string; role: string }`

### Token Storage

- Stored in `localStorage` under key `authToken`, sent as `Authorization: Bearer <token>`, cleared on logout or invalid token.
- Login/register pages hide the Navbar; after login the app redirects to the stored return URL or `/dashboard`.

### Troubleshooting

- **Token not sent**: check `localStorage` for `authToken`, confirm Apollo's authLink is configured, check the Network tab for the `Authorization` header.
- **Redirect loop**: clear `localStorage`, check `ProtectedRoute` logic, verify the token against the backend.
- **401 errors**: token expired/invalid — logout and log back in, check backend JWT config.

### Known Gaps / Production Hardening

- `Tasks` and `AI` endpoints currently carry `@Public()` on the backend — remove before deployment.
- Token is kept in `localStorage`; consider httpOnly cookies for production.
- No token refresh, password reset, email verification, "remember me", CSRF protection, rate limiting, or 2FA yet.

---

## Frontend-Backend Database Integration

### Integrated Pages

| Page | Frontend Query/Mutation | Backend Table | Status |
|------|--------------------------|----------------|--------|
| Dashboard (`/dashboard`) | `dashboardStats` | users, tasks, jobs | Integrated |
| Profile (`/profile`) | `users`, `user(id)`, `createUser`, `updateUser` | users | Integrated, full CRUD |
| Tasks (`/tasks`) | `tasks(filters)`, `createTask`, `cancelTask` | tasks | Cached (Worker Service is source of truth; DB provides persistence/fallback) |
| AI Chat (`/ai-chat`) | `chat` mutation, `chatHistory` query | chat_messages | Integrated — both user and assistant messages persisted |
| Analytics (`/analytics`) | `dashboardInsights`, `dashboardTrends` | dashboard_insights | Cached, 1-hour TTL; trends computed from DB data |

Example queries:

```graphql
query DashboardStats {
  dashboardStats { title value trend trendValue }
}

query GetChatHistory($userId: String!, $conversationId: String) {
  chatHistory(userId: $userId, conversationId: $conversationId) {
    id role content conversationId timestamp
  }
}

query DashboardTrends($days: Int) {
  dashboardTrends(days: $days) {
    period
    taskCompletionTrend { day completed failed }
    userGrowthTrend { day users }
  }
}
```

### Chat History Hook (frontend, needs wiring to the existing backend query)

```typescript
// frontend/hooks/useAI.ts
export function useChatHistory(userId: string, conversationId?: string) {
  const { data, loading, error } = useQuery<{ chatHistory: ChatMessage[] }>(
    GET_CHAT_HISTORY,
    { variables: { userId, conversationId }, skip: !userId }
  );

  return {
    messages: data?.chatHistory || [],
    loading,
    error: error?.message || null,
  };
}
```

### Jobs — Not Integrated

- GraphQL API exists (`jobs`, `job`, `createJob`, `pauseJob`, `resumeJob`, `deleteJob`) and the backend service methods work against the Worker Service.
- Not stored in the database: Worker Service manages jobs in-memory with integer IDs, while the schema expects UUID primary keys, so caching them would require an ID-format bridge.
- No frontend hooks or UI exist for jobs; the Tasks page references "jobs" but doesn't display them.
- If needed later: add hooks to `frontend/hooks/useTasks.ts`, build job management UI, and fetch directly from the Worker Service (no DB cache).

### Analytics KPIs — Mock Data

The Analytics page's KPI cards (e.g. "Revenue Growth: 24.5%") are hardcoded. Acceptable for demo purposes; a real implementation would add `analytics_metrics` / `performance_metrics` tables.

### Remaining Gaps (by priority)

**High** — add the `useChatHistory()` hook to the frontend (backend side is done); build Jobs frontend integration (hooks + UI + Tasks page tab).

**Medium** — sessions table for login history/active sessions; user activity logging/audit trail; system metrics (CPU/memory/disk, historical).

**Low** — custom/user-defined KPIs to replace mock analytics data; notifications table for in-app alerts.

### Summary

Core data (users, tasks, chat, dashboard insights) is fully persisted and integrated end-to-end. The two concrete gaps are the missing `useChatHistory()` frontend hook and the absence of any Jobs UI; everything else is optional future enhancement.
