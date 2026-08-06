# AI Integration

How the AI Service is wired into the API Gateway: architecture, auth, configuration, endpoints, and testing.

## Overview

The AI Service is a standalone NestJS microservice that provides chat, insights, analysis, summarization, and recommendation features. The API Gateway exposes these capabilities to the frontend over GraphQL, and also proxies to plain REST for direct/debug access.

```
Frontend (Next.js, :3000)
    │  GraphQL queries/mutations
    ▼
API Gateway (:4000)
    │  AIResolver → AIService → AIClient
    │  HTTP + X-API-Key header
    ▼
AI Service (:5000)
    │  AIController → AIService → OpenAIService / CacheService / WorkerClientService
    ▼
OpenAI API (optional) or mock responses
```

## Architecture

### API Gateway side (`backend/api-gateway/src/`)

| Component | File | Purpose |
|-----------|------|---------|
| `AIClient` | `services/ai.client.ts` | HTTP client to the AI Service; attaches the `X-API-Key` header, handles timeouts/errors/logging |
| `AIModule` | `modules/ai/ai.module.ts` | NestJS module wiring `AIService`, `AIResolver`, `AIClient` |
| `AIService` | `modules/ai/ai.service.ts` | Business logic layer between resolvers and `AIClient` |
| `AIResolver` | `modules/ai/ai.resolver.ts` | GraphQL mutations/queries |
| AI Models | `modules/ai/ai.model.ts` | GraphQL input/output types |

`AIModule` is imported and `AIClient` is provided in `backend/api-gateway/src/app.module.ts`.

### AI Service side (`backend/ai-service/src/`)

| Component | File | Purpose |
|-----------|------|---------|
| `AIController` | `controllers/ai.controller.ts` | REST endpoints |
| `AIService` | `services/ai.service.ts` | Business logic |
| `OpenAIService` | `services/openai.service.ts` | Real OpenAI integration (falls back to mock responses if no key) |
| `CacheService` | `services/cache.service.ts` | Response caching |
| `WorkerClientService` | — | Delegates heavy/async processing to the Worker Service |
| `ApiKeyGuard` | `guards/api-key.guard.ts` | Validates `X-API-Key` on inbound requests |

## Authentication (API Gateway ↔ AI Service)

Requests from the API Gateway to the AI Service are authenticated with a shared secret sent as the `X-API-Key` header.

- **`AIClient`** (`backend/api-gateway/src/services/ai.client.ts`) reads `AI_SERVICE_API_KEY` at startup and attaches it to every outbound request as `X-API-Key`. It logs whether the key is configured (without logging the key itself) and warns if it's missing.
- **`ApiKeyGuard`** (`backend/ai-service/src/guards/api-key.guard.ts`) checks incoming requests:
  - Routes marked `@Public()` skip the check entirely.
  - If `AI_SERVICE_API_KEY` is not set on the AI Service, the guard allows all requests through (development-mode fallback — do not rely on this in production).
  - Otherwise it compares the request's `X-API-Key` header against the configured value and throws `401 Unauthorized` ("Invalid or missing API key") on mismatch or absence.

Both sides read `AI_SERVICE_API_KEY` from the environment, so the same value must be set for `api-gateway` and `ai-service` — in `docker-compose.dev.yml` both services set:

```yaml
AI_SERVICE_API_KEY=${AI_SERVICE_API_KEY:-ai-secret-key-change-in-production}
```

**Root cause of a past outage:** the gateway and AI service picked up different values for `AI_SERVICE_API_KEY` (one saw the `.env` value, the other fell back to the compose default), so every gateway→AI request failed with "Invalid or missing API key" and the dashboard's AI features stopped loading. Fix: ensure both services reference the same `${AI_SERVICE_API_KEY}` substitution (or an explicit `env_file` pointing at the same `.env`) so they never diverge, and use the guard's warn-level logging plus the boot-time "is SET/NOT SET" log lines in `main.ts` to catch a missing key immediately.

In production, always set `AI_SERVICE_API_KEY` to a strong random value (e.g. `openssl rand -hex 32`) — never rely on the guard's no-key-configured fallback.

## Configuration

### Environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `AI_SERVICE_URL` | API Gateway | Base URL for the AI Service (`http://ai-service:5000` in Docker, `http://localhost:5000` for local dev) |
| `AI_SERVICE_API_KEY` | Both | Shared secret for the `X-API-Key` header; must match on both services |
| `OPENAI_API_KEY` | AI Service | Optional; enables real OpenAI-backed responses. Without it, the AI Service returns mock/deterministic responses |
| `PORT` | Both | `4000` for API Gateway, `5000` for AI Service |
| `NODE_ENV` | Both | `development` / `production` |

### docker-compose.dev.yml (relevant excerpt)

```yaml
api-gateway:
  environment:
    - AI_SERVICE_URL=http://ai-service:5000
    - AI_SERVICE_API_KEY=${AI_SERVICE_API_KEY:-ai-secret-key-change-in-production}
  depends_on:
    ai-service:
      condition: service_healthy

ai-service:
  environment:
    - AI_SERVICE_API_KEY=${AI_SERVICE_API_KEY:-ai-secret-key-change-in-production}
    - OPENAI_API_KEY=${OPENAI_API_KEY}
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Local (non-Docker) development

```bash
# .env at repo root
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_API_KEY=some-shared-secret
OPENAI_API_KEY=your_openai_api_key_here   # optional
```

## Endpoints

### GraphQL (via API Gateway: `http://localhost:4000/graphql`)

| Type | Operation | Description |
|------|-----------|--------------|
| Mutation | `chat(input: ChatRequestInput): ChatResponse` | Chat with the AI assistant |
| Mutation | `analyzeData(input: AnalysisRequestInput): AnalysisResponse` | Analyze a dataset |
| Mutation | `generateSummary(input: SummaryRequestInput): SummaryResponse` | Summarize text |
| Query | `insights(input: InsightRequestInput): [Insight]` | Generate insights |
| Query | `recommendations(input: RecommendationsRequestInput): RecommendationsResponse` | Get recommendations |

Example:

```graphql
mutation {
  chat(input: {
    messages: [{ role: user, content: "Analyze my system performance" }]
    userId: "user123"
    options: { temperature: 0.7, maxTokens: 2000 }
  }) {
    message
    role
    conversationId
    tokensUsed
    model
    timestamp
  }
}
```

```graphql
query {
  insights(input: {
    type: analytics
    data: { metrics: [{ name: "cpu", value: 75 }, { name: "memory", value: 80 }] }
    userId: "user123"
  }) {
    id
    title
    description
    confidence
    recommendations
  }
}
```

### REST (direct to AI Service: `http://localhost:5000`)

| Method | Path | Description |
|--------|------|--------------|
| GET | `/health` | Health check |
| POST | `/ai/chat` | Chat with AI |
| POST | `/ai/insights` | Generate insights |
| POST | `/ai/analyze` | Quick analysis |
| POST | `/ai/chat/batch` | Batch chat processing |
| GET | `/ai/conversation/:id` | Get conversation history |
| DELETE | `/ai/conversation/:id` | Clear conversation |

Direct REST calls require the `X-API-Key` header (unless the endpoint is `@Public()` or `AI_SERVICE_API_KEY` is unset on the AI Service):

```bash
curl -X POST http://localhost:5000/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $AI_SERVICE_API_KEY" \
  -d '{"message": "Hello, what can you help me with?"}'
```

### Health checks

```
GET /health  →  { "status": "ok", "timestamp": "..." }
```

The API Gateway's `/health` additionally reports downstream service status:

```json
{
  "status": "ok",
  "timestamp": "...",
  "services": { "ai": "ok", "worker": "ok", "database": "ok" }
}
```

## Error handling

- **503 Service Unavailable** — AI Service is unreachable or still starting.
- **401 Unauthorized** — missing/invalid `X-API-Key` (see Authentication above).
- **Timeout** — requests to the AI Service time out after ~30s.
- **400 Bad Request** — invalid input, with a descriptive message.
- **500** — unexpected internal errors, logged with stack traces.

```json
{ "statusCode": 503, "message": "AI Service is unavailable", "error": "Service Unavailable" }
```

## Testing

### Start services

```bash
docker-compose -f docker-compose.dev.yml up -d
# wait ~30-40s for health checks
docker ps
```

### Automated integration test

```bash
./scripts/test-ai-gateway-integration.sh
```

Covers health checks, direct AI Service REST endpoints, GraphQL mutations/queries through the gateway, conversation management, batch processing, and error scenarios.

### Manual checks

```bash
# Health
curl http://localhost:5000/health
curl http://localhost:4000/health

# Direct REST
curl -X POST http://localhost:5000/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $AI_SERVICE_API_KEY" \
  -d '{"message": "Hello, AI!"}'

# GraphQL via API Gateway
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { chat(input: {messages: [{role: user, content: \"Hi\"}]}) { message } }"}'
```

GraphQL Playground: `http://localhost:4000/graphql`.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Connection refused | `docker ps`; `docker logs ai-service`; `docker logs api-gateway` |
| `401 Invalid or missing API key` | `AI_SERVICE_API_KEY` differs (or is unset) between `api-gateway` and `ai-service`; check boot logs for "AI_SERVICE_API_KEY is SET/NOT SET" |
| 503 / health check failing | AI Service may still be starting; `curl http://localhost:5000/health`; `docker-compose -f docker-compose.dev.yml restart` |
| GraphQL errors | Validate query against the schema; `docker logs -f api-gateway`; verify connectivity with `docker exec api-gateway curl http://ai-service:5000/health` |
| Timeouts | Check `docker stats` for resource pressure; consider raising the client timeout |

## References

- [AI Service API Documentation](../backend/ai-service/API_DOCUMENTATION.md)
- [API Gateway README](../backend/api-gateway/README.md)
- [GraphQL Schema](../backend/api-gateway/src/schema.gql)
- [Health Checks](./HEALTH_CHECKS.md)
