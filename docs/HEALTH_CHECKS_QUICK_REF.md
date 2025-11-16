# Health Check Quick Reference

## Endpoints

| Service | Port | Endpoint | Details |
|---------|------|----------|---------|
| API Gateway | 4000 | `/health` | Basic status |
| API Gateway | 4000 | `/health/detailed` | All services status |
| Worker Service | 4001 | `/health` | Worker + queue stats |
| AI Service | 5000 | `/health` | AI + models info |

## Quick Test Commands

```bash
# Test all services
curl http://localhost:4000/health
curl http://localhost:4000/health/detailed
curl http://localhost:4001/health
curl http://localhost:5000/health

# Run integration tests
./scripts/test-health-checks.sh

# Check with jq for pretty output
curl -s http://localhost:4000/health/detailed | jq

# Monitor continuously (every 5 seconds)
watch -n 5 'curl -s http://localhost:4000/health/detailed | jq'
```

## Status Codes

- `healthy` - All systems operational ✅
- `degraded` - Some services down, system partially functional ⚠️
- `unhealthy` - Critical services down ❌

## Docker Compose

```bash
# Start with health checks
docker-compose -f docker-compose.dev.yml up --build

# Check service health status
docker-compose -f docker-compose.dev.yml ps

# View health check logs
docker-compose -f docker-compose.dev.yml logs api-gateway
```

## Kubernetes

```bash
# Apply with health checks
kubectl apply -f k8s/

# Check pod health
kubectl get pods
kubectl describe pod <pod-name>

# View health check events
kubectl get events --sort-by='.lastTimestamp'
```

## Response Examples

### Basic Health (`/health`)
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "uptime": 3600000
}
```

### Detailed Health (`/health/detailed`)
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "services": {
    "apiGateway": { "status": "healthy", "message": "API Gateway is running" },
    "workerService": { "status": "healthy", "message": "Worker Service is operational" },
    "aiService": { "status": "healthy", "message": "AI Service is operational" }
  },
  "uptime": 3600000
}
```

## Troubleshooting

### Service Shows Unhealthy
1. Check service logs: `docker-compose logs <service-name>`
2. Verify service is running: `docker-compose ps`
3. Test endpoint directly: `curl http://localhost:<port>/health`
4. Check network connectivity between services

### Health Check Timeout
1. Increase timeout in K8s manifest
2. Increase timeout in docker-compose.yml
3. Check service startup time
4. Verify no blocking operations in health endpoint

## Monitoring Integration

### Prometheus
```yaml
scrape_configs:
  - job_name: 'api-gateway'
    metrics_path: '/health/detailed'
    static_configs:
      - targets: ['api-gateway:4000']
```

### cURL Script for Monitoring
```bash
#!/bin/bash
STATUS=$(curl -s http://localhost:4000/health/detailed | jq -r '.status')
if [ "$STATUS" != "healthy" ]; then
  echo "ALERT: System status is $STATUS"
  # Send alert to monitoring system
fi
```
