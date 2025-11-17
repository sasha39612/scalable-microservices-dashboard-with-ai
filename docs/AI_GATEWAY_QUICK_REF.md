# AI Service & API Gateway Integration - Quick Reference

## 🚀 Quick Start

```bash
# 1. Start all services
docker-compose -f docker-compose.dev.yml up -d

# 2. Run integration tests
./scripts/test-ai-gateway-integration.sh

# 3. Access GraphQL Playground
open http://localhost:4000/graphql
```

## 📡 Service URLs

| Service | URL | GraphQL Playground |
|---------|-----|-------------------|
| API Gateway | http://localhost:4000 | ✓ Yes |
| AI Service | http://localhost:5000 | ✗ No (REST only) |
| Frontend | http://localhost:3000 | ✗ No |

## 🔌 Integration Points

### API Gateway → AI Service

```typescript
// Environment Variable
AI_SERVICE_URL=http://ai-service:5000

// Service Structure
AIClient (services/ai.client.ts)
    ↓
AIService (modules/ai/ai.service.ts)
    ↓
AIResolver (modules/ai/ai.resolver.ts)
    ↓
GraphQL API
```

## 📝 Common GraphQL Queries

### Chat
```graphql
mutation {
  chat(input: {
    messages: [{ role: user, content: "Hello!" }]
  }) {
    message
    conversationId
  }
}
```

### Insights
```graphql
query {
  insights(input: {
    type: analytics
    data: {}
  }) {
    id
    title
    description
  }
}
```

### Analysis
```graphql
mutation {
  analyzeData(input: {
    dataType: metrics
    data: []
  }) {
    results
    confidence
  }
}
```

## 🧪 Testing Commands

```bash
# Health checks
curl http://localhost:5000/health  # AI Service
curl http://localhost:4000/health  # API Gateway

# Direct AI Service test
curl -X POST http://localhost:5000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# GraphQL test (via API Gateway)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { chat(input: {messages: [{role: user, content: \"Hi\"}]}) { message } }"}'
```

## 🐛 Troubleshooting

```bash
# Check running services
docker ps

# View logs
docker logs api-gateway
docker logs ai-service

# Restart services
docker-compose -f docker-compose.dev.yml restart api-gateway
docker-compose -f docker-compose.dev.yml restart ai-service

# Full rebuild
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
```

## 🔍 Service Status Check

```bash
# One-liner to check all AI-related services
echo "AI Service: $(curl -s http://localhost:5000/health | jq -r .status)" && \
echo "API Gateway: $(curl -s http://localhost:4000/health | jq -r .status)"
```

## 📊 Available AI Endpoints

### Via GraphQL (API Gateway: 4000)
- ✓ `mutation chat(input: ChatRequestInput)`
- ✓ `query insights(input: InsightRequestInput)`
- ✓ `mutation analyzeData(input: AnalysisRequestInput)`
- ✓ `query recommendations(input: RecommendationsRequestInput)`
- ✓ `mutation generateSummary(input: SummaryRequestInput)`

### Direct REST (AI Service: 5000)
- ✓ `POST /ai/chat`
- ✓ `POST /ai/insights`
- ✓ `POST /ai/analyze`
- ✓ `POST /ai/chat/batch`
- ✓ `GET /ai/conversation/:id`
- ✓ `DELETE /ai/conversation/:id`

## 🔐 Environment Variables

```bash
# API Gateway
AI_SERVICE_URL=http://ai-service:5000

# AI Service (Optional)
OPENAI_API_KEY=sk-...  # For real OpenAI integration
PORT=5000
NODE_ENV=development
```

## ✅ Integration Checklist

- [x] AI Service running on port 5000
- [x] API Gateway running on port 4000
- [x] AIClient configured with correct URL
- [x] AIModule imported in AppModule
- [x] GraphQL resolvers implemented
- [x] Health checks working
- [x] Docker networking configured
- [x] Integration tests passing

## 📚 Documentation Links

- Full Integration Guide: `docs/AI_GATEWAY_INTEGRATION.md`
- AI Service API: `backend/ai-service/API_DOCUMENTATION.md`
- Test Script: `scripts/test-ai-gateway-integration.sh`
