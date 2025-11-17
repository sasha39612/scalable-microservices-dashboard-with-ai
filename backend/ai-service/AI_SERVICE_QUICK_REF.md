# AI Service - Quick Reference Guide

## Setup

### 1. Install Dependencies
Already installed:
- `openai` - OpenAI SDK
- `ioredis` - Redis client for caching
- `axios` - HTTP client for Worker Service

### 2. Environment Variables

Add to your `.env` file:

```bash
# Required for OpenAI features
OPENAI_API_KEY=sk-your-key-here

# Optional but recommended for caching
REDIS_URL=redis://localhost:6379

# Optional for async processing
WORKER_SERVICE_URL=http://localhost:4001
```

### 3. Start Redis (Optional)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or using Homebrew on macOS
brew services start redis
```

## New Services Created

### 1. OpenAI Service (`openai.service.ts`)
- **Purpose**: Wrapper for OpenAI API
- **Key Methods**:
  - `createChatCompletion()` - Generate chat responses
  - `generateDataInsights()` - Generate insights from data
  - `createEmbedding()` - Generate embeddings
  - `streamChatCompletion()` - Stream responses

### 2. Cache Service (`cache.service.ts`)
- **Purpose**: Redis-based caching layer
- **Key Methods**:
  - `get()` / `set()` - Basic cache operations
  - `delete()` / `deletePattern()` - Remove cache entries
  - `getChatCacheKey()` - Generate chat cache keys
  - `getInsightsCacheKey()` - Generate insights cache keys

### 3. Worker Client Service (`worker-client.service.ts`)
- **Purpose**: Async job processing via Worker Service
- **Key Methods**:
  - `createJob()` - Create async job
  - `getJobStatus()` - Check job status
  - `getJobResult()` - Get completed job result
  - `createAIProcessingJob()` - Helper for AI jobs

## API Examples

### Chat Request
```bash
curl -X POST http://localhost:4002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze my system performance",
    "conversationId": "conv_123",
    "context": ["dashboard", "metrics"]
  }'
```

### Insights Request (Sync)
```bash
curl -X POST http://localhost:4002/api/insights \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{"value": 100}, {"value": 200}],
    "insightType": "performance",
    "context": "Production environment"
  }'
```

### Insights Request (Async)
```bash
curl -X POST http://localhost:4002/api/insights \
  -H "Content-Type: application/json" \
  -d '{
    "data": [...large dataset...],
    "insightType": "trends",
    "async": true
  }'
```

## Features

### ✅ Implemented
- [x] OpenAI GPT-4 integration
- [x] Redis caching with TTL
- [x] Worker Service async processing
- [x] Conversation history management
- [x] Smart fallback to mock responses
- [x] Context-aware prompts
- [x] Structured insights generation
- [x] Data visualizations
- [x] Cache statistics
- [x] Health monitoring

### 🎯 Cache Strategy
- **Chat responses**: 30 min TTL
- **Insights**: 2 hours TTL
- **Conversations**: 1 hour TTL

### 🚀 Async Processing
- Automatically triggered for datasets > 1000 items
- Can be forced with `async: true` flag
- Returns job ID for status tracking

## Service Status Checks

### Check if OpenAI is configured
```typescript
openaiService.isAvailable() // true/false
```

### Check if Redis is connected
```typescript
cacheService.isAvailable() // true/false
```

### Check if Worker Service is reachable
```typescript
workerClient.isWorkerAvailable() // true/false
```

## Graceful Degradation

All services handle failures gracefully:
- **No OpenAI key**: Falls back to mock responses
- **Redis down**: Skips caching, continues operation
- **Worker unavailable**: Processes synchronously

## File Structure

```
backend/ai-service/src/
├── services/
│   ├── ai.service.ts           # Main AI service (updated)
│   ├── openai.service.ts       # NEW: OpenAI wrapper
│   ├── cache.service.ts        # NEW: Redis caching
│   └── worker-client.service.ts # NEW: Worker client
├── dto/
│   └── chat.dto.ts             # Updated with new fields
├── ai-module.ts                # Updated with new providers
└── ...
```

## Monitoring

### Cache Stats
```typescript
const stats = await cacheService.getStats();
// Returns: { connected, dbSize, memory }
```

### Worker Stats
```typescript
const stats = await workerClient.getStats();
// Returns: { available, url, pendingJobs, processingJobs }
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OpenAI errors | Check API key, verify credits |
| Redis connection failed | Ensure Redis is running on 6379 |
| Worker Service unavailable | Check WORKER_SERVICE_URL, verify service is running |
| High token usage | Enable caching, use smaller contexts |
| Slow responses | Check if Redis is working, consider async processing |

## Testing

Run the test suite:
```bash
cd backend/ai-service
pnpm test
```

## Next Steps

1. **Configure environment variables** in `.env`
2. **Start Redis** if using caching
3. **Add OpenAI API key** to enable AI features
4. **Test the endpoints** using the examples above
5. **Monitor logs** for any issues

## Documentation

- Full docs: `AI_SERVICE_IMPLEMENTATION.md`
- API docs: `API_DOCUMENTATION.md`
- Health checks: `/docs/HEALTH_CHECKS_IMPLEMENTATION.md`
