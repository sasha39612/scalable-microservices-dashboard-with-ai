# Health Checks

Health check endpoints across all microservices, used for container orchestration, load balancing, service discovery, and monitoring.

## Overview

Every backend service exposes a `/health` endpoint. The API Gateway additionally exposes `/health/detailed`, which aggregates the status of the Worker Service and AI Service into a single system-wide view.

Overall status is reported as one of:

| Status | Meaning |
|---|---|
| `healthy` | All services operational |
| `degraded` | Some non-critical services unavailable |
| `unhealthy` | Critical services unavailable |

## Quick Reference

| Service | Port | Endpoint | Returns |
|---|---|---|---|
| API Gateway | 4000 | `GET /health` | Basic status + uptime |
| API Gateway | 4000 | `GET /health/detailed` | Aggregated status of all services |
| Worker Service | 4001 | `GET /health` | Status + queue statistics |
| AI Service | 5000 | `GET /health` | Status + available models |

```bash
# Test all services
curl http://localhost:4000/health
curl http://localhost:4000/health/detailed
curl http://localhost:4001/health
curl http://localhost:5000/health

# Pretty output
curl -s http://localhost:4000/health/detailed | jq

# Monitor continuously (every 5 seconds)
watch -n 5 'curl -s http://localhost:4000/health/detailed | jq'

# Integration test script
./scripts/test-health-checks.sh
```

## Endpoint Details

### API Gateway — Basic Health

`GET /health`

```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "uptime": 3600000
}
```

### API Gateway — Detailed Health

`GET /health/detailed`

Queries the Worker Service and AI Service and returns their combined status alongside the gateway's own.

```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "services": {
    "apiGateway": {
      "status": "healthy",
      "message": "API Gateway is running",
      "timestamp": "2025-11-16T10:30:00.000Z",
      "details": { "uptime": 3600000, "version": "1.0.0" }
    },
    "workerService": {
      "status": "healthy",
      "message": "Worker Service is operational",
      "timestamp": "2025-11-16T10:30:00.000Z",
      "details": {
        "status": "healthy",
        "uptime": 3600000,
        "service": "worker-service",
        "version": "1.0.0",
        "queues": { "pending": 5, "active": 2, "completed": 150, "failed": 3 }
      }
    },
    "aiService": {
      "status": "healthy",
      "message": "AI Service is operational",
      "timestamp": "2025-11-16T10:30:00.000Z",
      "details": {
        "status": "healthy",
        "uptime": 3600000,
        "service": "ai-service",
        "version": "1.0.0",
        "models": ["gpt-3.5-turbo", "text-davinci-003"]
      }
    }
  },
  "uptime": 3600000
}
```

If a dependent service is unreachable, its entry reflects that instead:

```json
{
  "status": "unhealthy",
  "message": "Service unavailable",
  "timestamp": "2025-11-16T10:30:00.000Z"
}
```

### Worker Service Health

`GET /health` (port 4001)

```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "uptime": 3600000,
  "service": "worker-service",
  "version": "1.0.0",
  "queues": { "pending": 5, "active": 2, "completed": 150, "failed": 3 }
}
```

### AI Service Health

`GET /health` (port 5000)

```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "uptime": 3600000,
  "service": "ai-service",
  "version": "1.0.0",
  "models": ["gpt-3.5-turbo", "text-davinci-003"]
}
```

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose
- curl (for testing)

### Install & Run

```bash
# Install dependencies (root, or per-service)
pnpm install

# Build and start all services
docker-compose -f docker-compose.dev.yml up --build
```

Services start in dependency order based on health check conditions:

1. AI Service (port 5000)
2. Worker Service (port 4001)
3. API Gateway (port 4000)
4. Frontend (port 3000)

Verify once running:

```bash
./scripts/test-health-checks.sh
# or manually:
curl http://localhost:4000/health
curl http://localhost:4000/health/detailed
curl http://localhost:4001/health
curl http://localhost:5000/health
```

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Service listen port | 4000 (Gateway) / 4001 (Worker) / 5000 (AI) |
| `WORKER_SERVICE_URL` | Used by Gateway for detailed health checks | `http://worker-service:4001` |
| `AI_SERVICE_URL` | Used by Gateway for detailed health checks | `http://ai-service:5000` |

## Configuration

### Docker Compose

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

Useful commands:

```bash
docker-compose -f docker-compose.dev.yml ps                    # service health status
docker-compose -f docker-compose.dev.yml logs api-gateway       # health check logs
```

### Kubernetes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

```bash
kubectl apply -f k8s/
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs -f <pod-name>
```

## Monitoring Integration

`/health/detailed` is designed to be scraped by monitoring tools (Prometheus, Datadog, New Relic, Grafana, custom dashboards).

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'microservices-health'
    metrics_path: '/health/detailed'
    scrape_interval: 30s
    static_configs:
      - targets:
          - 'api-gateway:4000'
```

Simple alerting script:

```bash
#!/bin/bash
STATUS=$(curl -s http://localhost:4000/health/detailed | jq -r '.status')
if [ "$STATUS" != "healthy" ]; then
  echo "ALERT: System status is $STATUS"
  # Send alert to monitoring system
fi
```

## Best Practices

1. Use basic health checks (`/health`) for container orchestration and load balancers.
2. Use the detailed health check (`/health/detailed`) for monitoring and alerting.
3. Set timeouts generous enough to avoid false positives under load.
4. Track health check response times — they can signal performance issues.
5. Configure retry logic to tolerate transient failures.

## Troubleshooting

**Module not found (`Cannot find module '@nestjs/common'`)**

```bash
cd backend/worker-service
pnpm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
cd ../ai-service
pnpm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
```

**Port already in use**

```bash
lsof -ti:4000 | xargs kill -9
lsof -ti:4001 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

**Docker issues**

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

**Health check timeouts** — increase timeouts in `docker-compose.dev.yml` or the Kubernetes probe config:

```yaml
healthcheck:
  interval: 60s
  timeout: 20s
  start_period: 60s
```

**Service shows unhealthy**

1. Check logs: `docker-compose logs <service-name>`
2. Verify the service is running: `docker-compose ps`
3. Hit the endpoint directly: `curl http://localhost:<port>/health`
4. Check network connectivity between services
