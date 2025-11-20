# JWT Security - Quick Reference

## 🔑 Generate Secrets

```bash
# Access Token Secret
openssl rand -base64 64

# Refresh Token Secret (use different value)
openssl rand -base64 64
```

## 📝 Environment Variables

```bash
# Required
JWT_ACCESS_SECRET=<your-64-char-secret>
JWT_REFRESH_SECRET=<your-different-64-char-secret>

# Optional (defaults shown)
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

## 🔄 Token Flow

```
Login → Receive Both Tokens
  ↓
Use Access Token (15min)
  ↓
Access Token Expires → Use Refresh Token
  ↓
Get New Token Pair → Continue
  ↓
Logout → Invalidate Refresh Token
```

## 📡 GraphQL Mutations

### Login
```graphql
mutation {
  login(email: "user@example.com", password: "password") {
    accessToken
    refreshToken
    user { id email name role }
  }
}
```

### Refresh
```graphql
mutation {
  refreshToken(refreshToken: "your-refresh-token") {
    accessToken
    refreshToken
    user { id email name role }
  }
}
```

### Logout
```graphql
mutation {
  logout(userId: "user-id")
}
```

## 🛡️ Security Features

- ✅ No default secrets in production
- ✅ Separate access/refresh secrets
- ✅ Short-lived access tokens (15m)
- ✅ Hashed refresh tokens in DB
- ✅ Automatic token rotation
- ✅ Logout invalidates tokens

## 🚀 Client Implementation

```typescript
// 1. Store tokens after login
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// 2. Use access token
headers: { 'Authorization': `Bearer ${accessToken}` }

// 3. On 401, refresh
const newToken = await refreshAccessToken();

// 4. Logout
await logout(userId);
localStorage.clear();
```

## 📊 Database Migration

```bash
# Production
psql $DATABASE_URL -f backend/api-gateway/migrations/add-refresh-token.sql

# Development with synchronize: true
# Automatically applied
```

## ⚠️ Production Checklist

- [ ] Generate strong secrets
- [ ] Set JWT_ACCESS_SECRET
- [ ] Set JWT_REFRESH_SECRET
- [ ] Run database migration
- [ ] Update Kubernetes secrets
- [ ] Test authentication flow
- [ ] Monitor token refresh rate

## 📁 Files Modified

- `backend/api-gateway/src/modules/auth/auth.module.ts`
- `backend/api-gateway/src/modules/auth/auth.service.ts`
- `backend/api-gateway/src/modules/auth/auth.resolve.ts`
- `backend/api-gateway/src/modules/user/user.entity.ts`
- `backend/api-gateway/src/modules/user/user.service.ts`
- `.env.example`
- `k8s/config.yaml`
- `scripts/setup-local-k8s.sh`

---
**See**: `JWT_SECURITY_IMPLEMENTATION.md` for full documentation
