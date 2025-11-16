# Health Check Endpoints

This document describes the health check endpoints available across all services in the Scalable Microservices Dashboard.

## Overview

Health checks are implemented across all services to monitor system health and enable proper orchestration, load balancing, and service discovery.

## API Gateway Health Endpoints

### Basic Health Check

**Endpoint:** `GET /health`

Returns basic health status of the API Gateway.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "uptime": 3600000
}
```

### Detailed Health Check

**Endpoint:** `GET /health/detailed`

Returns comprehensive health status including all dependent services (Worker Service and AI Service).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "services": {
    "apiGateway": {
      "status": "healthy",
      "message": "API Gateway is running",
      "timestamp": "2025-11-16T10:30:00.000Z",
      "details": {
        "uptime": 3600000,
        "version": "1.0.0"
      }
    },
    "workerService": {
      "status": "healthy",
      "message": "Worker Service is operational",
      "timestamp": "2025-11-16T10:30:00.000Z",
      "details": {
        "status": "healthy",
        "timestamp": "2025-11-16T10:30:00.000Z",
        "uptime": 3600000,
        "service": "worker-service",
        "version": "1.0.0",
        "queues": {
          "pending": 5,
          "active": 2,
          "completed": 150,
          "failed": 3
        }
      }
    },
    "aiService": {
      "status": "healthy",
      "message": "AI Service is operational",
      "timestamp": "2025-11-16T10:30:00.000Z",
      "details": {
        "status": "healthy",
        "timestamp": "2025-11-16T10:30:00.000Z",
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

**Status Codes:**
- `healthy`: All services are operational
- `degraded`: Some non-critical services are unavailable
- `unhealthy`: Critical services are unavailable

## Worker Service Health Endpoint

**Endpoint:** `GET /health`

Returns health status of the Worker Service including queue statistics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "uptime": 3600000,
  "service": "worker-service",
  "version": "1.0.0",
  "queues": {
    "pending": 5,
    "active": 2,
    "completed": 150,
    "failed": 3
  }
}
```

## AI Service Health Endpoint

**Endpoint:** `GET /health`

Returns health status of the AI Service including available models.

**Response:**
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

## Usage in Kubernetes

Health checks can be used in Kubernetes for liveness and readiness probes:

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

## Usage in Docker Compose

Health checks can be configured in `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Monitoring Integration

The detailed health endpoint (`/health/detailed`) is designed for monitoring systems like:
- Prometheus
- Datadog
- New Relic
- Custom monitoring dashboards

## Error Handling

When a service is unavailable, the health check will return:

```json
{
  "status": "unhealthy",
  "message": "Service unavailable",
  "timestamp": "2025-11-16T10:30:00.000Z"
}
```

## Best Practices

1. **Use basic health checks** (`/health`) for container orchestration and load balancers
2. **Use detailed health checks** (`/health/detailed`) for monitoring and alerting
3. **Set appropriate timeouts** to avoid false positives during high load
4. **Monitor health check response times** as they can indicate performance issues
5. **Configure proper retry logic** to handle transient failures

## Testing

Health check endpoints can be tested using curl:

```bash
# Basic health check
curl http://localhost:4000/health

# Detailed health check
curl http://localhost:4000/health/detailed

# Worker Service health
curl http://localhost:4001/health

# AI Service health
curl http://localhost:5000/health
```

## Environment Variables

Services use the following environment variables for health checks:

- `PORT`: Port number for the service (default: 4000 for API Gateway, 4001 for Worker, 5000 for AI)
- `WORKER_SERVICE_URL`: URL for Worker Service health checks (default: http://worker-service:4001)
- `AI_SERVICE_URL`: URL for AI Service health checks (default: http://ai-service:5000)
