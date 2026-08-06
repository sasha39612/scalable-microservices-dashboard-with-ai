# Redis Security

Reference documentation for the Redis hardening applied to this project: what the original exposure was, what protects it now, how it's configured, and how to verify it.

## Original Vulnerabilities

1. **Public internet exposure** — Redis was reachable from the public internet on port 6379.
2. **No authentication** — no password (SASL/`requirepass`) was configured.
3. **Unrestricted access** — anyone who could connect had full read/write access to all data.
4. **No network segmentation** — Redis was not isolated to an internal network.

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC INTERNET                          │
│                           ❌                                 │
│                  (No Access to Redis)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Firewall
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      HOST MACHINE                           │
│                                                             │
│  Port 3000 → Frontend (Next.js)                            │
│  Port 4000 → API Gateway (GraphQL)                         │
│  Port 5000 → AI Service                                    │
│                                                             │
│  ❌ Port 6379 NOT exposed (Redis isolated)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Docker Bridge
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             ISOLATED BACKEND NETWORK                        │
│             (Docker Network: "backend")                     │
│                                                             │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐    │
│  │  Frontend  │───▶│ API Gateway │───▶│ Worker Svc   │    │
│  │            │    │             │    │              │    │
│  └────────────┘    └─────────────┘    └──────────────┘    │
│                           │                                │
│                           │ Authenticated                  │
│                           │ Connection Only                │
│                           ▼                                │
│                    ┌─────────────┐                         │
│                    │ AI Service  │                         │
│                    │             │                         │
│                    └──────┬──────┘                         │
│                           │                                │
│                           │ Password Required              │
│                           │ REDIS_PASSWORD                 │
│                           ▼                                │
│                    ┌─────────────┐                         │
│                    │   REDIS     │  🔒 SECURED             │
│                    │   :6379     │                         │
│                    │             │                         │
│                    │ Features:   │                         │
│                    │ • Password  │                         │
│                    │ • No Public │                         │
│                    │ • Isolated  │                         │
│                    │ • Commands  │                         │
│                    │   Disabled  │                         │
│                    └─────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────┐
│ AI Service  │
└──────┬──────┘
       │ 1. Read REDIS_PASSWORD from environment
       ▼
┌─────────────────────────────────────┐
│ Connection String:                  │
│ redis://:PASSWORD@redis:6379        │
└──────┬──────────────────────────────┘
       │ 2. Connect with AUTH command
       ▼
┌─────────────┐      ┌──────────────────────┐
│   REDIS     │──────│ Verify Password      │
│   Server    │      │ requirepass check    │
└─────────────┘      └──────┬───────────────┘
       │                     │
       │◀────────────────────┘
       ├── ✓ YES ──▶ Connection Established
       └── ✗ NO  ──▶ WRONGPASS Error
```

### Kubernetes Topology (Production)

```
┌───────────────────────────────────────────────────────┐
│                 Kubernetes Cluster                    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │         Namespace: default                  │    │
│  │  ┌────────────────────────────────┐        │    │
│  │  │  NetworkPolicy                 │        │    │
│  │  │  • Ingress: ai-service only    │        │    │
│  │  │  • Egress: DNS + ai-service    │        │    │
│  │  └───────────────┬────────────────┘        │    │
│  │                  ▼                          │    │
│  │  ┌────────────────────────────────┐        │    │
│  │  │  AI Service Pod                │        │    │
│  │  │  env: REDIS_PASSWORD (secret)  │        │    │
│  │  └──────────┬─────────────────────┘        │    │
│  │             │ Password Auth                 │    │
│  │             ▼                               │    │
│  │  ┌────────────────────────────────┐        │    │
│  │  │  Redis Service (ClusterIP)     │        │    │
│  │  │  • Internal IP only            │        │    │
│  │  │  • No LoadBalancer / NodePort  │        │    │
│  │  └──────────┬─────────────────────┘        │    │
│  │             ▼                               │    │
│  │  ┌────────────────────────────────┐        │    │
│  │  │  Redis Pod                     │        │    │
│  │  │  • Non-root user (999)         │        │    │
│  │  │  • Dropped capabilities        │        │    │
│  │  │  • Password from Secret        │        │    │
│  │  └────────────────────────────────┘        │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  Secrets (encrypted at rest)                │    │
│  │  • redis-secret: password (base64)          │    │
│  └─────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

## Security Layers (Defense in Depth)

| Layer | Controls |
|---|---|
| 1. Network Isolation | No public port exposure; internal Docker network only; Kubernetes `NetworkPolicy` |
| 2. Authentication | `requirepass` enforced; strong 32+ character password; environment-variable based |
| 3. Command Restrictions | `FLUSHDB`, `FLUSHALL`, `CONFIG`, `DEBUG` disabled; `SHUTDOWN` renamed |
| 4. Resource Limits | 256MB max memory, `allkeys-lru` eviction, connection timeouts |
| 5. Monitoring & Logging | Connection logs, failed-auth logging, authenticated health checks |

## Implemented Measures

### 1. Password Authentication

```bash
# Generate a strong password
openssl rand -base64 32

# Set in .env
REDIS_PASSWORD=your-strong-random-password-here
```

- `requirepass` enforced in Redis config — password required for every connection.
- Anonymous access disabled completely.

### 2. Network Isolation

**Docker Compose (development)**

```yaml
redis:
  # Removed public port mapping
  # ports:
  #   - "6379:6379"

  # Only expose to internal Docker network
  expose:
    - "6379"

  networks:
    - backend
```

Redis is not reachable from the host machine or the internet — only services on the `backend` Docker network can connect.

**Kubernetes (production)**

```yaml
# ClusterIP service - internal only
spec:
  type: ClusterIP  # Not LoadBalancer or NodePort

# NetworkPolicy - strict ingress/egress rules
spec:
  ingress:
    - from:
      - podSelector:
          matchLabels:
            app: ai-service  # Only ai-service can connect
```

No external exposure via LoadBalancer/NodePort; NetworkPolicy enforces pod-to-pod rules so only `ai-service` can reach Redis.

### 3. Redis Configuration Hardening

**Disabled dangerous commands:**

```conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command SHUTDOWN SHUTDOWN_SECRET
rename-command DEBUG ""
```

**Memory and resource limits:**

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

**Connection security:**

```conf
protected-mode yes
bind 0.0.0.0  # Within isolated network only
timeout 300
tcp-keepalive 300
```

### 4. Secrets Management

- **Development**: password stored in `.env` (gitignored), passed via environment variables to containers.
- **Production (Kubernetes)**:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
type: Opaque
data:
  redis-password: <base64-encoded-password>
```

Stored encrypted, not visible in container definitions, rotatable without code changes, integrated with Kubernetes RBAC.

### 5. Application-Level Authentication

`cache.service.ts` supports password authentication two ways:

```bash
# Password embedded in URL
REDIS_URL=redis://:password@redis:6379

# Or separate password variable
REDIS_PASSWORD=password
```

The service auto-detects whether the URL already contains a password and falls back to `REDIS_PASSWORD` if not, supporting both URL-based and host/port/password configuration.

### 6. Container Security

- Non-root user in the Redis container/pod.
- Security context with dropped capabilities (Kubernetes).
- Authenticated liveness/readiness health checks.

## Configuration Reference

| Variable | Purpose |
|---|---|
| `REDIS_PASSWORD` | Password used for `requirepass` and by clients to authenticate |
| `REDIS_URL` | Full connection string, e.g. `redis://:password@redis:6379` |
| `REDIS_HOST` / `REDIS_PORT` | Used with `REDIS_PASSWORD` when not using a single URL |

Related files:

- `backend/ai-service/redis.conf` — Redis server configuration (auth, disabled commands, memory limits).
- `docker-compose.dev.yml` — Redis service definition (no public port, `backend` network, password env var).
- `k8s/redis.yaml` — Kubernetes Secret, ConfigMap, Deployment, Service (ClusterIP), and NetworkPolicy.
- `backend/common/src/config/env.validation.ts` — validates `REDIS_PASSWORD` is present.
- `backend/ai-service/src/services/cache.service.ts` — connects using the password.
- `scripts/test-redis-security.sh` — automated security verification script.

## Verifying / Testing Security

### Automated

```bash
./scripts/test-redis-security.sh
```

Checks: public access blocked, auth required, wrong password rejected, correct password works, dangerous commands disabled, AI service connectivity, network isolation, memory limits.

### Manual — Development (Docker Compose)

```bash
# Should FAIL (no public access)
redis-cli -h localhost -p 6379 ping

# Should FAIL (no password)
docker exec -it ai-service redis-cli -h redis ping

# Should SUCCEED (correct password)
docker exec -it ai-service redis-cli -h redis -a $REDIS_PASSWORD ping
```

```bash
# NOAUTH check
docker exec -it redis redis-cli -h localhost ping
# Expected: (error) NOAUTH Authentication required

# Wrong password check
docker exec -it redis redis-cli -h localhost -a wrongpass ping
# Expected: (error) WRONGPASS invalid username-password pair
```

### Manual — Production (Kubernetes)

```bash
# Generate and base64-encode a password
PASSWORD=$(openssl rand -base64 32)
echo -n "$PASSWORD" | base64

# Deploy
kubectl apply -f k8s/redis.yaml

# Verify NetworkPolicy blocks unauthorized pods
kubectl run test --image=redis:alpine -it --rm -- redis-cli -h redis -a $PASSWORD ping
```

### Verification Checklist

```
Deploy Redis
  → Check 1: Password set?        redis-cli ping            → expect NOAUTH error
  → Check 2: Public access?       redis-cli -h host ping     → expect connection refused
  → Check 3: Commands disabled?   redis-cli FLUSHDB          → expect unknown command
  → Check 4: Auth works?          redis-cli -a $PASS ping    → expect PONG
```

## Deployment

### Development

```bash
cp .env.example .env
# set REDIS_PASSWORD=<generated password> in .env

docker-compose -f docker-compose.dev.yml up -d
```

### Production (Kubernetes)

```bash
PASSWORD=$(openssl rand -base64 32)
kubectl create secret generic redis-secret --from-literal=redis-password=$PASSWORD

kubectl apply -f k8s/redis.yaml

# Give ai-service the same password
kubectl create secret generic ai-service-secret --from-literal=redis-password=$PASSWORD
```

Reference the secret in the AI service deployment:

```yaml
env:
  - name: REDIS_PASSWORD
    valueFrom:
      secretKeyRef:
        name: ai-service-secret
        key: redis-password
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Can't connect to Redis | Check `REDIS_PASSWORD` is set: `docker exec -it ai-service env \| grep REDIS` |
| `NOAUTH Authentication required` | Ensure `REDIS_PASSWORD` is passed to the app via `docker-compose.yml` env |
| Connection timeout | Verify both services are on the same Docker network: `docker network inspect <project>_backend` |
| Kubernetes pods can't connect | Check the secret exists/mounts: `kubectl get secrets`, `kubectl describe secret redis-secret`, `kubectl logs <ai-service-pod>` |

## Recommended for Production (Not Yet Implemented)

1. **TLS/SSL encryption**

   ```conf
   tls-port 6379
   tls-cert-file /path/to/redis.crt
   tls-key-file /path/to/redis.key
   tls-ca-cert-file /path/to/ca.crt
   ```

2. **Redis Sentinel/Cluster** — high availability, automatic failover, replication.
3. **Monitoring & alerting** — track failed auth attempts and connection patterns (e.g. Redis Exporter + Prometheus).
4. **Regular updates** — keep Redis on latest stable version, apply patches promptly.
5. **Backup & recovery** — periodic RDB snapshots, offsite storage, tested restores.
6. **Rate limiting** — at the application level, to blunt brute-force attempts.
7. **IP whitelisting** — cloud firewall rules limited to known service IPs; VPC/VPN for multi-region.

## Password Rotation

1. Generate a new password.
2. Update the Kubernetes secret (or `.env` for development).
3. Rolling-restart dependent services.

## References

- [Redis Security Documentation](https://redis.io/docs/management/security/)
- [Redis ACL (Access Control Lists)](https://redis.io/docs/management/security/acl/)
- [OWASP Redis Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Redis_Security_Cheat_Sheet.html)
- [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
