# AI Service & API Gateway Integration

## Overview

This document describes the integration between the AI Service and API Gateway, ensuring that AI capabilities are accessible through the GraphQL API.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   Frontend  │────────▶│ API Gateway  │────────▶│ AI Service │
│  (GraphQL)  │         │   (Port 4000)│         │(Port 5000) │
└─────────────┘         └──────────────┘         └────────────┘
                               │
                               │ Uses AIClient
                               ▼
                        ┌──────────────┐
                        │  AIModule    │
                        │  AIService   │
                        │  AIResolver  │
                        └──────────────┘
```

## Integration Components

### 1. AI Service (Backend Service)

**Location:** `backend/ai-service/`

**Endpoints:**
- `POST /ai/chat` - Chat with AI assistant
- `POST /ai/insights` - Generate insights from data
- `POST /ai/analyze` - Quick data analysis
- `POST /ai/chat/batch` - Batch chat processing
- `GET /ai/conversation/:id` - Get conversation history
- `DELETE /ai/conversation/:id` - Clear conversation

**Configuration:**
```yaml
Environment Variables:
  - PORT: 5000
  - NODE_ENV: development
  - OPENAI_API_KEY: (optional for OpenAI integration)
```

### 2. API Gateway Integration

**Location:** `backend/api-gateway/`

The API Gateway integrates with AI Service through:

#### a. AIClient Service (`src/services/ai.client.ts`)

HTTP client that communicates with AI Service REST API:

```typescript
@Injectable()
export class AIClient {
  private readonly aiServiceUrl: string;
  
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:5000';
  }
  
  // Methods:
  async chat(request: ChatRequest): Promise<ChatResponse>
  async getInsights(request: InsightRequest): Promise<Insight[]>
  async analyzeData(request: AnalysisRequest): Promise<AnalysisResponse>
  async getRecommendations(request): Promise<recommendations>
  async generateSummary(request): Promise<summary>
  async predictTrends(request): Promise<predictions>
  async detectAnomalies(request): Promise<anomalies>
  async getConversationHistory(request): Promise<messages>
  async healthCheck(): Promise<health>
}
```

#### b. AIModule (`src/modules/ai/ai.module.ts`)

NestJS module that provides AI functionality:

```typescript
@Module({
  providers: [AIService, AIResolver, AIClient],
  exports: [AIService],
})
export class AIModule {}
```

#### c. AIService (`src/modules/ai/ai.service.ts`)

Business logic layer that uses AIClient:

```typescript
@Injectable()
export class AIService {
  constructor(private readonly aiClient: AIClient) {}
  
  async chat(input: ChatRequestInput): Promise<ChatResponse>
  async getInsights(input: InsightRequestInput): Promise<Insight[]>
  async analyzeData(input: AnalysisRequestInput): Promise<AnalysisResponse>
  async getRecommendations(input): Promise<recommendations>
  async generateSummary(input): Promise<summary>
}
```

#### d. AIResolver (`src/modules/ai/ai.resolver.ts`)

GraphQL resolver exposing AI features:

```typescript
@Resolver()
export class AIResolver {
  @Mutation(() => ChatResponse)
  async chat(@Args('input') input: ChatRequestInput)
  
  @Query(() => [Insight])
  async insights(@Args('input') input: InsightRequestInput)
  
  @Mutation(() => AnalysisResponse)
  async analyzeData(@Args('input') input: AnalysisRequestInput)
  
  @Query(() => RecommendationsResponse)
  async recommendations(@Args('input') input: RecommendationsRequestInput)
  
  @Mutation(() => SummaryResponse)
  async generateSummary(@Args('input') input: SummaryRequestInput)
}
```

## GraphQL API Usage

### Chat with AI

```graphql
mutation {
  chat(input: {
    messages: [
      { role: user, content: "Hello, analyze my system performance" }
    ]
    userId: "user123"
    options: {
      temperature: 0.7
      maxTokens: 2000
    }
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

### Get Insights

```graphql
query {
  insights(input: {
    type: analytics
    data: {
      metrics: [
        { name: "cpu", value: 75 }
        { name: "memory", value: 80 }
      ]
    }
    userId: "user123"
  }) {
    id
    type
    title
    description
    data
    confidence
    recommendations
    createdAt
  }
}
```

### Analyze Data

```graphql
mutation {
  analyzeData(input: {
    dataType: metrics
    data: [
      { timestamp: "2025-11-17T10:00:00Z", value: 75 }
      { timestamp: "2025-11-17T11:00:00Z", value: 80 }
    ]
    analysisType: trend
  }) {
    results
    insights
    visualizations
    confidence
    processedAt
  }
}
```

### Get Recommendations

```graphql
query {
  recommendations(input: {
    userId: "user123"
    context: {
      currentTasks: 5
      completionRate: 0.85
    }
    count: 5
  }) {
    recommendations {
      id
      title
      description
      priority
      confidence
    }
  }
}
```

### Generate Summary

```graphql
mutation {
  generateSummary(input: {
    text: "Your long text here..."
    maxLength: 200
  }) {
    summary
    keyPoints
    sentiment
    wordCount
  }
}
```

## REST API Usage (Direct to AI Service)

### Chat

```bash
curl -X POST http://localhost:5000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what can you help me with?",
    "conversationId": "conv_123",
    "context": ["dashboard", "analytics"]
  }'
```

### Insights

```bash
curl -X POST http://localhost:5000/ai/insights \
  -H "Content-Type: application/json" \
  -d '{
    "insightType": "analytics",
    "data": [
      {"metric": "cpu", "value": 75},
      {"metric": "memory", "value": 80}
    ]
  }'
```

### Analyze

```bash
curl -X POST http://localhost:5000/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What trends do you see?",
    "data": [1, 2, 3, 4, 5]
  }'
```

## Testing the Integration

### Run Integration Tests

```bash
# Test AI Service and API Gateway integration
./scripts/test-ai-gateway-integration.sh
```

### Manual Testing

1. **Start all services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Check service health:**
   ```bash
   # AI Service
   curl http://localhost:5000/health
   
   # API Gateway
   curl http://localhost:4000/health
   ```

3. **Test GraphQL playground:**
   - Open http://localhost:4000/graphql in browser
   - Use the GraphQL queries from examples above

4. **Check logs:**
   ```bash
   # API Gateway logs
   docker logs -f api-gateway
   
   # AI Service logs
   docker logs -f ai-service
   ```

## Environment Configuration

### docker-compose.dev.yml

```yaml
api-gateway:
  environment:
    - AI_SERVICE_URL=http://ai-service:5000
  depends_on:
    ai-service:
      condition: service_healthy

ai-service:
  environment:
    - PORT=5000
    - NODE_ENV=development
    - OPENAI_API_KEY=${OPENAI_API_KEY} # Optional
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Local Development

Create `.env` file in project root:

```bash
# API Gateway
AI_SERVICE_URL=http://localhost:5000

# AI Service (Optional)
OPENAI_API_KEY=your_openai_api_key_here
```

## Error Handling

The integration includes comprehensive error handling:

1. **Service Unavailable:** If AI Service is down, API Gateway returns 503
2. **Timeout:** Requests timeout after 30s with appropriate error
3. **Invalid Requests:** Returns 400 with detailed error message
4. **Internal Errors:** Returns 500 with logged error details

Example error response:

```json
{
  "statusCode": 503,
  "message": "AI Service is unavailable",
  "error": "Service Unavailable"
}
```

## Health Checks

Both services implement health check endpoints:

### AI Service Health
```bash
GET /health
Response: { "status": "ok", "timestamp": "2025-11-17T..." }
```

### API Gateway Health
```bash
GET /health
Response: {
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "services": {
    "ai": "ok",
    "worker": "ok",
    "database": "ok"
  }
}
```

## Performance Considerations

1. **Caching:** AI Service implements caching for repeated queries
2. **Async Processing:** Large datasets processed via Worker Service
3. **Connection Pooling:** HTTP connections reused via keep-alive
4. **Timeouts:** Reasonable timeouts prevent hanging requests
5. **Rate Limiting:** Consider implementing for production

## Monitoring

Monitor the integration through:

1. **Logs:** Check docker logs for both services
2. **Health endpoints:** Automated health checks
3. **GraphQL playground:** Test queries interactively
4. **Metrics:** Consider adding Prometheus/Grafana

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if AI Service is running: `docker ps | grep ai-service`
   - Verify AI_SERVICE_URL environment variable
   - Check network connectivity: `docker network inspect microservices-network`

2. **503 Service Unavailable**
   - AI Service may be starting up (wait for health check)
   - Check AI Service logs: `docker logs ai-service`
   - Verify health check passes: `curl http://localhost:5000/health`

3. **Timeout Errors**
   - AI Service may be overloaded
   - Check system resources: `docker stats`
   - Consider increasing timeout values

4. **GraphQL Errors**
   - Validate query syntax in playground
   - Check API Gateway logs for details
   - Verify input types match schema

### Debug Mode

Enable debug logging:

```bash
# Set in docker-compose.dev.yml
environment:
  - LOG_LEVEL=debug
```

## Next Steps

- [ ] Add authentication/authorization for AI endpoints
- [ ] Implement rate limiting for API calls
- [ ] Add metrics and monitoring (Prometheus)
- [ ] Set up alerting for service failures
- [ ] Add integration tests to CI/CD pipeline
- [ ] Implement request caching at gateway level
- [ ] Add API versioning
- [ ] Create user documentation

## References

- [AI Service API Documentation](../backend/ai-service/API_DOCUMENTATION.md)
- [API Gateway Documentation](../backend/api-gateway/README.md)
- [GraphQL Schema](../backend/api-gateway/src/schema.gql)
- [Health Checks Documentation](./HEALTH_CHECKS.md)
