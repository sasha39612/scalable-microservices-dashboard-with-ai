# Installation & Setup for Health Checks

## Prerequisites

Ensure you have the following installed:
- Node.js 18+ 
- pnpm
- Docker & Docker Compose
- curl (for testing)

## Installation Steps

### 1. Install Dependencies

The Worker Service and AI Service need NestJS dependencies installed:

```bash
# From project root
cd backend/worker-service
pnpm install

cd ../ai-service
pnpm install

cd ../..
```

Or install all at once from root:

```bash
pnpm install
```

### 2. Build Docker Images

```bash
docker-compose -f docker-compose.dev.yml build
```

### 3. Start Services

```bash
docker-compose -f docker-compose.dev.yml up
```

Services will start in order based on health check dependencies:
1. AI Service (port 5000)
2. Worker Service (port 4001)
3. API Gateway (port 4000)
4. Frontend (port 3000)

### 4. Verify Health Checks

In a new terminal, run:

```bash
# Wait ~30 seconds for services to fully start, then test
./scripts/test-health-checks.sh
```

Or manually:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/detailed
curl http://localhost:4001/health
curl http://localhost:5000/health
```

## Expected Responses

### All Services Healthy

```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "services": {
    "apiGateway": { "status": "healthy" },
    "workerService": { "status": "healthy" },
    "aiService": { "status": "healthy" }
  },
  "uptime": 3600000
}
```

## Troubleshooting

### Module Not Found Errors

If you see `Cannot find module '@nestjs/common'`:

```bash
cd backend/worker-service
pnpm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs

cd ../ai-service
pnpm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
```

### Port Already in Use

```bash
# Kill processes on ports
lsof -ti:4000 | xargs kill -9
lsof -ti:4001 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Docker Issues

```bash
# Clean and restart
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### Health Check Timeout

Increase timeouts in `docker-compose.dev.yml`:

```yaml
healthcheck:
  interval: 60s  # Increase from 30s
  timeout: 20s   # Increase from 10s
  start_period: 60s  # Increase from 40s
```

## Package.json Updates Needed

### Worker Service (`backend/worker-service/package.json`)

Ensure these dependencies exist:

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### AI Service (`backend/ai-service/package.json`)

Same dependencies as Worker Service.

## Kubernetes Deployment

If deploying to Kubernetes:

```bash
# Apply configurations
kubectl apply -f k8s/

# Check pod health
kubectl get pods
kubectl describe pod api-gateway-xxx

# View health check logs
kubectl logs -f api-gateway-xxx
```

## Monitoring Setup

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'microservices-health'
    metrics_path: '/health/detailed'
    scrape_interval: 30s
    static_configs:
      - targets:
          - 'api-gateway:4000'
```

### Grafana Dashboard

Import the health check metrics and create visualizations for:
- Overall system status
- Individual service health
- Service uptime
- Response times

## Next Steps

1. ✅ Install dependencies
2. ✅ Start services with Docker Compose
3. ✅ Verify health checks are working
4. ✅ Set up monitoring (optional)
5. ✅ Configure alerting (optional)
6. ✅ Deploy to production

## Additional Resources

- [Health Checks Documentation](./docs/HEALTH_CHECKS.md)
- [Quick Reference](./docs/HEALTH_CHECKS_QUICK_REF.md)
- [Implementation Details](./docs/HEALTH_CHECKS_IMPLEMENTATION.md)
