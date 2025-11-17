# Scalable Microservices Dashboard with AI 🚀🤖

Full-stack microservices application that aggregates multiple APIs, processes background tasks, caches results, and provides a real-time dashboard for web (and optional mobile). Includes AI-powered insights and chat assistant for predictive analytics and data summarization.

## ✅ Key Features
### Backend

* NestJS microservices architecture (API Gateway + worker services + AI microservice)
* GraphQL + REST API endpoints for aggregated data
* Background job processing using BullMQ / RabbitMQ
* Redis caching for API responses, job statuses, and AI results
* PostgreSQL database with TypeORM / Prisma
* OAuth2 authentication and secure API access

### AI Microservice:

* OpenAI API for summarization, insights, and predictive analytics
* LangChain integration for chat assistant querying dashboard data
* Optional ML models for anomaly detection or trend prediction

### Frontend

* Next.js 15 + React 19 dashboard
* Dynamic charts with Recharts / Chart.js
* Modular components and modern React hooks (useEffect, useReducer, useRef)
* Production-ready optimizations (Turbo compiler, code splitting, SSR / SSG)
* AI Chat / Insights panel to interact with AI service
* DevOps / Deployment
* Dockerized backend, AI service, and frontend
* CI/CD pipeline with GitHub Actions (lint, test, build, deploy)
* Deployment: backend & AI microservice on Railway / AWS, frontend on Vercel

### Testing

* Jest unit & integration tests for backend services, AI microservice, and resolvers
* React Testing Library for frontend components including AI chat
* Coverage reports with badges
* Optional Mobile
* React Native / Expo app synced with backend APIs
* Real-time updates and AI insights

## 💡 Portfolio Highlights

* Built scalable microservices architecture with caching, queues, and AI microservice.
* Implemented AI-powered insights, summarization, and predictive analytics using OpenAI API.
* Developed AI chat assistant to query aggregated API data intelligently.
* Delivered production-ready web dashboard and optional mobile app.
* CI/CD pipeline and Docker deployment ensured enterprise-grade reliability.

## 📁 Project Structure
```bash
microservices-dashboard/
├── backend/                     
│   ├── api-gateway/             
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── resolvers/       
│   │   │   └── main.ts
│   │   └── Dockerfile
│   ├── worker-service/          
│   │   ├── src/
│   │   │   ├── jobs/
│   │   │   ├── services/
│   │   │   └── main.ts
│   │   └── Dockerfile
│   ├── ai-service/               # New AI microservice
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── services/         # OpenAI / LangChain / ML logic
│   │   │   └── main.ts
│   │   └── Dockerfile
│   ├── common/                  
│   └── docker-compose.yml        # Includes AI service
├── frontend/                     
│   ├── src/
│   │   ├── components/
│   │   │   └── AIChat/           # React component for AI chat & insights
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── tests/
│   │   ├── components/
│   │   └── pages/
│   └── Dockerfile
├── mobile/ (optional)            
│   ├── src/
│   │   ├── components/
│   │   └── screens/
│   └── app.json
├── scripts/                      
├── README.md
└── package.json
```

## 🛠 Tech Stack

* **Backend:** NestJS, GraphQL, REST API, PostgreSQL, Redis, BullMQ / RabbitMQ, OpenAI API, LangChain
* **Frontend:** Next.js 15, React 19, TypeScript, Recharts / Chart.js, SSR / SSG
* **Mobile:** (Optional): React Native / Expo
* **DevOps:** Docker, Docker Compose, GitHub Actions CI/CD, Vercel, Railway / AWS
* **Testing:** Jest, React Testing Library

## 🤖 AI Service Integration

The AI Service is fully integrated with the API Gateway, providing powerful AI capabilities through both GraphQL and REST APIs:

**Features:**
- 💬 **AI Chat Assistant:** Multi-turn conversations with context awareness
- 📊 **Data Insights:** AI-powered analytics and recommendations
- 🔍 **Data Analysis:** Trend detection, anomaly detection, and predictions
- 📝 **Summarization:** Intelligent text and data summarization
- ⚡ **Performance:** Response caching and async processing for large datasets

**Access Methods:**
1. **GraphQL API** (via API Gateway): `http://localhost:4000/graphql`
2. **REST API** (direct): `http://localhost:5000/ai/*`

**Quick Test:**
```bash
# Test AI integration
./scripts/test-ai-gateway-integration.sh

# Or manually test
curl -X POST http://localhost:5000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze my system performance"}'
```

**GraphQL Example:**
```graphql
mutation {
  chat(input: {
    messages: [
      { role: user, content: "What insights can you provide?" }
    ]
  }) {
    message
    conversationId
  }
}
```

📖 **Documentation:**
- [AI Gateway Integration Guide](docs/AI_GATEWAY_INTEGRATION.md)
- [Quick Reference](docs/AI_GATEWAY_QUICK_REF.md)
- [AI Service API](backend/ai-service/API_DOCUMENTATION.md)
- [Integration Summary](AI_INTEGRATION_SUMMARY.md)

## 🏥 Health Checks

Comprehensive health monitoring is implemented across all services:

* **API Gateway:** `/health` (basic) and `/health/detailed` (with all service statuses)
* **Worker Service:** `/health` (includes queue statistics)
* **AI Service:** `/health` (includes available models)

Health checks are integrated with:
- Kubernetes readiness and liveness probes
- Docker Compose service dependencies
- Monitoring systems (Prometheus, Datadog, etc.)

**Quick Test:**
```bash
# Test all services
curl http://localhost:4000/health/detailed

# Run integration tests
./scripts/test-health-checks.sh
```

📖 **Documentation:**
- [Health Checks Guide](docs/HEALTH_CHECKS.md)
- [Implementation Details](docs/HEALTH_CHECKS_IMPLEMENTATION.md)
- [Quick Reference](docs/HEALTH_CHECKS_QUICK_REF.md)

## 🚀 Deployment

* **Backend & AI microservice:** Railway / AWS
* **Frontend:** Vercel
* **Mobile:** Expo (optional)
* **CI/CD:** GitHub Actions (lint, test, build, deploy)

## 💡 Why This Project Adds Value to My Portfolio

#### ✅ Enterprise full-stack architecture – designed API Gateway, background worker services, and a dedicated AI microservice using NestJS.
#### ✅ AI-powered insights & predictive analytics – generates real-time data summaries, trend detection, and actionable recommendations using OpenAI API and optional ML models.
#### ✅ AI chat assistant – allows intelligent querying of aggregated API data directly from the dashboard.
#### ✅ Scalable & performant backend – Redis caching, BullMQ queues, PostgreSQL database, and secure OAuth2 authentication.
#### ✅ Modern frontend & optional mobile – Next.js 15 dashboard with React 19, dynamic charts, modular components, and optional React Native / Expo app.
#### ✅ DevOps & production readiness – Dockerized microservices, CI/CD pipeline with GitHub Actions, and deployed to cloud platforms (Vercel, Railway/AWS).
#### ✅ Testing discipline – unit and integration tests for backend and AI services, React Testing Library for frontend, with coverage reports and badges.
