# AI Service API Documentation

## Overview
The AI Service provides REST endpoints for AI-powered chat interactions and data insights generation.

## Base URL
```
http://localhost:5000/ai
```

## Endpoints

### 1. Chat with AI Assistant

**Endpoint:** `POST /ai/chat`

**Description:** Send a message to the AI assistant and receive a contextual response.

**Request Body:**
```json
{
  "message": "How can I improve my system performance?",
  "conversationId": "conv_1234567890_abc123", // Optional - for continuing conversation
  "context": ["previous context", "additional info"] // Optional
}
```

**Response:**
```json
{
  "conversationId": "conv_1234567890_abc123",
  "response": "Based on the data, your system performance...",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "metadata": {
    "model": "mock-ai-model",
    "tokensUsed": 150,
    "confidence": 0.85
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the performance metrics?"
  }'
```

---

### 2. Generate Insights

**Endpoint:** `POST /ai/insights`

**Description:** Generate AI-powered insights from provided data.

**Request Body:**
```json
{
  "data": [
    { "metric": "cpu", "value": 75, "timestamp": "2025-11-17T10:00:00Z" },
    { "metric": "memory", "value": 60, "timestamp": "2025-11-17T10:00:00Z" }
  ],
  "insightType": "performance", // "performance" | "usage" | "trends" | "anomalies" | "predictions"
  "timeRange": { // Optional
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-17T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "insights": {
    "summary": "System performance is stable with minor optimization opportunities.",
    "keyFindings": [
      "Average response time: 250ms",
      "Peak usage hours: 2pm-5pm",
      "3% of requests exceed 1s threshold"
    ],
    "recommendations": [
      "Implement caching for frequently accessed data",
      "Consider load balancing during peak hours",
      "Optimize database indexes"
    ],
    "confidence": 0.88
  },
  "visualizations": [
    {
      "type": "line",
      "data": [{"x": 0, "y": 45.2}, {"x": 1, "y": 67.8}]
    }
  ],
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

**Insight Types:**
- `performance` - System performance analysis
- `usage` - User engagement and usage patterns
- `trends` - Trend detection and forecasting
- `anomalies` - Anomaly detection in data
- `predictions` - Future predictions and forecasts

**cURL Example:**
```bash
curl -X POST http://localhost:5000/ai/insights \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{"metric": "cpu", "value": 75}],
    "insightType": "performance"
  }'
```

---

### 3. Get Conversation History

**Endpoint:** `GET /ai/conversation/:conversationId`

**Description:** Retrieve the full conversation history for a given conversation ID.

**Response:**
```json
[
  {
    "role": "user",
    "content": "What is my system performance?"
  },
  {
    "role": "assistant",
    "content": "Your system performance is good with 95% uptime..."
  }
]
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/ai/conversation/conv_1234567890_abc123
```

---

### 4. Clear Conversation

**Endpoint:** `DELETE /ai/conversation/:conversationId`

**Description:** Clear the conversation history for a given conversation ID.

**Response:** `204 No Content`

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/ai/conversation/conv_1234567890_abc123
```

---

### 5. Batch Chat

**Endpoint:** `POST /ai/chat/batch`

**Description:** Process multiple chat messages in a single request.

**Request Body:**
```json
[
  {
    "message": "First question about performance"
  },
  {
    "message": "Second question about analytics"
  },
  {
    "message": "Third question about users"
  }
]
```

**Response:**
```json
[
  {
    "conversationId": "conv_123_abc",
    "response": "Response to first question...",
    "timestamp": "2025-11-17T10:30:00.000Z",
    "metadata": {...}
  },
  {
    "conversationId": "conv_456_def",
    "response": "Response to second question...",
    "timestamp": "2025-11-17T10:30:01.000Z",
    "metadata": {...}
  },
  {
    "conversationId": "conv_789_ghi",
    "response": "Response to third question...",
    "timestamp": "2025-11-17T10:30:02.000Z",
    "metadata": {...}
  }
]
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/ai/chat/batch \
  -H "Content-Type: application/json" \
  -d '[
    {"message": "What is performance?"},
    {"message": "What are the trends?"}
  ]'
```

---

### 6. Quick Analysis

**Endpoint:** `POST /ai/analyze`

**Description:** Perform a quick analysis on provided data with a specific query.

**Request Body:**
```json
{
  "query": "What trends do you see in this data?",
  "data": [10, 20, 35, 45, 60, 80]
}
```

**Response:**
```json
{
  "analysis": "The data shows an upward trend with increasing values...",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Analyze this performance data",
    "data": [75, 80, 82, 78, 85]
  }'
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Successful request
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## Validation Rules

### ChatMessageDto
- `message`: Required, string, max 5000 characters
- `conversationId`: Optional, string
- `context`: Optional, array of strings

### InsightsRequestDto
- `data`: Required, array
- `insightType`: Required, must be one of: "performance", "usage", "trends", "anomalies", "predictions"
- `timeRange`: Optional, object with start and end dates

---

## Integration Notes

### Frontend Integration Example (TypeScript/React)
```typescript
// Chat with AI
const response = await fetch('http://localhost:5000/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How can I improve performance?',
    conversationId: currentConversationId,
  }),
});
const data = await response.json();

// Generate Insights
const insightsResponse = await fetch('http://localhost:5000/ai/insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: metricsData,
    insightType: 'performance',
  }),
});
const insights = await insightsResponse.json();
```

---

## Future Enhancements

- [ ] Integrate with OpenAI/Anthropic API
- [ ] Add streaming responses for real-time chat
- [ ] Implement RAG (Retrieval-Augmented Generation)
- [ ] Add authentication and rate limiting
- [ ] Support for file uploads and image analysis
- [ ] Multi-language support
- [ ] Fine-tuned models for specific domains
- [ ] WebSocket support for real-time updates

---

## Testing

Run tests with:
```bash
cd backend/ai-service
npm test
```

Run the service in development mode:
```bash
npm run start:dev
```

---

## Health Check

**Endpoint:** `GET /health`

Check if the service is running:
```bash
curl http://localhost:5000/health
```
