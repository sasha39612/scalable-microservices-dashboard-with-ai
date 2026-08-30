# Scalable Microservices Dashboard with AI

A microservices-based analytics dashboard that aggregates data from multiple upstream APIs, processes work asynchronously through a task queue, caches results in Redis, and exposes a real-time dashboard for web and mobile. A dedicated AI microservice provides summarization, insight generation, and a context-aware chat assistant over the aggregated data.

## Key Differentiator

The platform separates data aggregation, background processing, and AI reasoning into independent services behind a single API Gateway.

Unlike a monolithic dashboard, it:

- isolates long-running work (aggregation, AI calls) in a worker service so the request path stays fast
- caches both API responses and AI results in Redis to cut latency and third-party cost
- routes every client request through one gateway that owns authentication, RBAC, rate limiting, and caching

## Core Features

- JWT authentication (access + refresh tokens) with role-based access control, enforced at the API Gateway
- GraphQL and REST endpoints for aggregated dashboard data
- Background task processing via a custom in-memory task queue
- AI chat assistant with multi-turn, context-aware conversations
- AI-generated insights: summarization, trend detection, and anomaly flags
- Real-time dashboard with dynamic charts (web) and a React Native / Expo mobile client

---

## Quick Start (local)

```bash
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Build and start all services
docker-compose -f docker-compose.dev.yml up -d

# 3. Check that all services are running
docker-compose -f docker-compose.dev.yml ps
```

To rebuild a single service after code changes:

```bash
docker-compose -f docker-compose.dev.yml up -d --build ai-service
```

---

## Environment Variables

All variables live in a single `.env` file at the repo root. See [`.env.example`](.env.example) for the full list.

| Variable                                          | Description                                              |
| ------------------------------------------------- | ------------------------------------------------------- |
| `NODE_ENV`                                        | Runtime environment (`development` / `production`)      |
| `PORT`                                            | Default service port                                    |
| `DATABASE_URL`                                    | PostgreSQL connection string                            |
| `JWT_ACCESS_SECRET`                               | Secret for signing access tokens                        |
| `JWT_REFRESH_SECRET`                              | Secret for signing refresh tokens                       |
| `JWT_ACCESS_EXPIRATION`                           | Access token lifetime                                   |
| `JWT_REFRESH_EXPIRATION`                          | Refresh token lifetime                                  |
| `API_GATEWAY_PORT`                                | API Gateway listen port                                 |
| `WORKER_SERVICE_PORT`                             | Worker service listen port                               |
| `WORKER_SERVICE_URL`                              | Internal URL the gateway uses to reach the worker        |
| `WORKER_SERVICE_API_KEY`                          | Shared secret for gateway to worker calls                |
| `AI_SERVICE_PORT`                                 | AI service listen port                                   |
| `AI_SERVICE_URL`                                  | Internal URL the gateway uses to reach the AI service     |
| `AI_SERVICE_API_KEY`                              | Shared secret for gateway to AI service calls             |
| `OPENAI_API_KEY`                                  | OpenAI API key for the AI service                        |
| `REDIS_PASSWORD`                                  | Redis password                                           |
| `REDIS_URL`                                       | Redis connection string (cache + task state)              |
| `NEXT_PUBLIC_API_URL`                             | Public API URL baked into the frontend build              |

---

## Repository Structure

```
scalable-microservices-dashboard-with-ai/
├── .env.example                     # Template for all required env vars
├── docker-compose.dev.yml           # Local development orchestration
├── pnpm-workspace.yaml              # pnpm monorepo: backend/*, frontend (mobile is a separate npm project, not in the workspace)
├── backend/
│   ├── api-gateway/                 # GraphQL + REST gateway — auth, RBAC, rate limiting, caching
│   ├── worker-service/              # Background tasks (aggregation, async processing)
│   ├── ai-service/                  # OpenAI-powered chat, insights, summarization
│   └── common/                      # Shared DTOs, guards, and utilities
├── frontend/                        # Next.js 16, React 19, TypeScript
├── mobile/                          # React Native / Expo client
├── k8s/                             # Kubernetes manifests (deployments, probes)
├── scripts/                         # Integration test + operational scripts
├── docs/                            # Architecture and integration guides
└── .github/
    └── workflows/                   # GitHub Actions CI/CD
```

---

## Service Ports

| Service         | Port | Health endpoint |
| --------------- | ---- | --------------- |
| frontend        | 3000 | none — no health route or Docker healthcheck configured |
| api-gateway     | 4000 | `/health`       |
| worker-service  | 4001 | `/health`       |
| ai-service      | 5000 | `/health`       |
| redis           | —    | internal only   |

The worker service applies a global `api` route prefix but explicitly excludes `health`, so its health endpoint is `/health` (not `/api/health`).

---

## Architecture

```text
                         ┌──────────────────────┐
                         │       Next.js        │
                         │   React Dashboard    │
                         └──────────┬───────────┘
                                    │
                              GraphQL / REST
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     API Gateway      │
                         │        NestJS        │
                         └───────┬───────┬──────┘
                                 │       │
                    ┌────────────┘       └─────────────┐
                    ▼                                  ▼
          ┌──────────────────┐               ┌──────────────────┐
          │  Worker Service  │               │   AI Service     │
          │      NestJS      │               │      NestJS      │
          └────────┬─────────┘               └────────┬─────────┘
                   │                                  │
                   ▼                                  ▼
             ┌───────────┐                      ┌───────────┐
             │PostgreSQL │                      │  OpenAI   │
             │ Database  │                      │    API    │
             └───────────┘                      └───────────┘

        Redis Cache ◄── used directly by API Gateway (responses) and AI Service (AI results)
```

Requests enter through the **API Gateway**, which owns authentication, RBAC, rate limiting, and response caching. Read requests are served from cache or fanned out to backend services; long-running work is delegated to the **worker service**. The **AI service** is called by the gateway (GraphQL/REST) for chat and insight generation.

- **API Gateway** — single entry point; validates JWTs, enforces roles and rate limits, caches responses in Redis
- **Worker Service** — runs background tasks through a custom in-memory task queue, decoupling long work from the HTTP request cycle; persists task data to PostgreSQL
- **AI Service** — OpenAI-backed chat, summarization, and analysis; results cached in Redis to reduce repeated spend
- **Redis** — response cache (API Gateway) and AI-result cache (AI Service) — not used by the Worker Service, whose queue is purely in-memory
- **PostgreSQL** — persistent storage for aggregated data

Inter-service calls from the gateway to the worker and AI services are authenticated with per-service shared API keys (`WORKER_SERVICE_API_KEY`, `AI_SERVICE_API_KEY`).

---

## AI Service

The AI service is reachable through the gateway (GraphQL/REST) and directly over REST for internal calls.

**Capabilities:**

- Multi-turn chat assistant with conversation context
- Insight generation over aggregated dashboard data
- Trend and anomaly detection
- Text and data summarization
- Response caching to avoid recomputing identical requests

**REST example:**

```bash
curl -X POST http://localhost:5000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze my system performance"}'
```

**GraphQL example (via gateway):**

```graphql
mutation {
  chat(input: { messages: [{ role: user, content: "What insights can you provide?" }] }) {
    message
    conversationId
  }
}
```

Additional detail lives in [`docs/`](docs/).

---

## Health Checks

Every backend service exposes a health endpoint used by Docker Compose dependencies and Kubernetes readiness/liveness probes. The frontend has no health endpoint or Docker healthcheck configured.

- **API Gateway** — `/health` (basic) and `/health/detailed` (rolls up downstream service status)
- **Worker Service** — `/health` (includes queue statistics)
- **AI Service** — `/health` (includes available models)

Readiness and liveness probes are defined in the manifests under [`k8s/`](k8s/) for the api-gateway, worker-service, ai-service, postgres, and redis.

```bash
# Aggregated status across all services
curl http://localhost:4000/health/detailed
```

---

## Rate Limiting

The gateway enforces multi-tier, per-identity rate limits — user ID for authenticated requests, IP for anonymous ones. Health-check endpoints are exempt so monitoring is never throttled. Configuration lives in [`backend/api-gateway/src/config/rate-limit.config.ts`](backend/api-gateway/src/config/rate-limit.config.ts).

| Endpoint     | Limit   | Purpose             |
| ------------ | ------- | ------------------- |
| Login        | 3/min   | Prevent brute force |
| Registration | 1/5 min | Prevent spam        |
| AI Chat      | 5/min   | Control AI usage    |
| AI Analysis  | 2/min   | Protect resources   |
| Dashboard    | 20/min  | Standard operations |

AI endpoints carry the tightest limits because each request incurs real third-party API cost. Exceeding a limit returns `429 Too Many Requests`.

---

## Security

- **JWT authentication** — access + refresh tokens; all non-public endpoints require a valid token, verified at the gateway
- **Role-based access control** — `@Roles()` + `RolesGuard` registered as a global `APP_GUARD`, checking `user.role` against the roles required per route
- **Inter-service authentication** — gateway to worker and gateway to AI calls carry per-service shared API keys
- **Rate limiting** — per-user/per-IP limits applied before requests reach any backend service
- **Input validation** — `class-validator` DTOs across the NestJS services

---

## Technology Stack

### Frontend

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript
- **Charts**: hand-rolled SVG charts (no charting library dependency — see `frontend/components/analytics/Charts.tsx`)
- **Rendering**: SSR / SSG

### Backend

- **Runtime**: Node.js 20 / Alpine
- **Framework**: NestJS across all backend services (api-gateway, worker-service, ai-service, common)
- **Package manager**: pnpm workspace
- **API**: GraphQL (gateway) + REST (inter-service)
- **ORM**: TypeORM on PostgreSQL
- **Task queue**: custom in-memory queue in the worker service

### AI

- **Provider**: OpenAI API (`openai`)
- **Caching**: AI results cached in Redis (`ioredis`) to reduce repeated cost

### Mobile

- **Framework**: React Native / Expo, synced with the backend APIs

### Infrastructure

- **Database**: PostgreSQL
- **Cache**: Redis (used by API Gateway and AI Service; not by Worker Service)
- **Containerization**: Docker + Docker Compose (`docker-compose.dev.yml`)
- **Orchestration**: Kubernetes manifests in [`k8s/`](k8s/)
- **CI/CD**: GitHub Actions

---

## Testing

Unit and integration tests run with Jest (backend/AI) and React Testing Library (frontend).

```bash
pnpm -r test          # run all packages
pnpm --filter api-gateway test
pnpm --filter worker-service test
pnpm --filter ai-service test
pnpm --filter frontend test
```

Integration and smoke-test scripts live in [`scripts/`](scripts/).

---

## CI/CD (GitHub Actions)

- **`cd.yml`** — spins up a throwaway local Kind (Kubernetes-in-Docker) cluster and runs a smoke test against the deployed manifests
- **`ci-cd.yml`** — lint, test, and build, plus an SSH deploy job to a self-hosted server (gated on repository secrets; skipped when they are not set)

The SSH deploy job runs `scripts/deploy.sh` on the target host.

---

## Future Improvements

- Replace the in-memory task queue with a durable broker (e.g. BullMQ on Redis) for at-least-once delivery and horizontal worker scaling
- Streaming AI responses to the dashboard via SSE
- Prometheus/Grafana metrics on top of the existing health endpoints
- Expanded caching strategy for frequently requested aggregations
