# Scalable Microservices Dashboard with AI 🚀🤖

A full-stack TypeScript application demonstrating a microservices architecture for aggregating external APIs, processing background jobs, caching data, and providing an interactive analytics dashboard with AI-powered features.

## ✨ Overview

The project is built around a NestJS backend, a Next.js frontend, PostgreSQL persistence, Redis caching, background processing, and a dedicated AI service.

The main goal is to demonstrate practical full-stack engineering patterns such as service separation, API design, asynchronous processing, caching, authentication, rate limiting, testing, and containerized development.

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js         │
                         │   React Dashboard    │
                         └──────────┬───────────┘
                                    │
                              GraphQL / REST
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     API Gateway      │
                         │        NestJS        │
                         └───────┬───────┬──────┘
                                 │       │
                    ┌────────────┘       └─────────────┐
                    ▼                                  ▼
          ┌──────────────────┐               ┌──────────────────┐
          │  Worker Service  │               │   AI Service     │
          │      NestJS      │               │      NestJS      │
          └────────┬─────────┘               └────────┬─────────┘
                   │                                  │
                   ▼                                  ▼
             ┌───────────┐                      ┌───────────┐
             │   Redis   │                      │  OpenAI   │
             │   Cache   │                      │    API    │
             └───────────┘                      └───────────┘

                         ┌──────────────────────┐
                         │     PostgreSQL       │
                         │      Database        │
                         └──────────────────────┘
```

## 🚀 Key Features

### Backend

- NestJS microservices architecture
- API Gateway with GraphQL and REST APIs
- Background job processing with a custom in-memory task queue
- Redis-based caching
- PostgreSQL persistence
- OAuth2 authentication
- API rate limiting
- Health checks and service monitoring
- Asynchronous processing for long-running operations

### AI Service

- Dedicated AI microservice
- OpenAI API integration
- AI-powered data summarization
- Context-aware chat assistant
- Data insights and recommendations
- Response caching
- Asynchronous AI processing

### Frontend

- Next.js 15
- React 19
- TypeScript
- Interactive analytics dashboard
- Dynamic data visualizations
- AI chat and insights interface
- Modular component architecture

### Infrastructure

- Docker and Docker Compose
- GitHub Actions
- Containerized development environment
- Kubernetes configuration
- Service health checks
- Environment-based configuration

### Testing

- Jest unit tests
- Backend integration tests
- GraphQL resolver tests
- React Testing Library
- Frontend component tests
- Automated test execution through CI

## 🤖 AI Service Integration

The AI service is integrated with the API Gateway and provides AI functionality through the application API.

**AI capabilities:**

- 💬 **AI Chat Assistant** — multi-turn conversations with contextual messages
- 📊 **Data Insights** — AI-generated analysis and recommendations
- 📝 **Summarization** — summaries of application data
- ⚡ **Caching** — avoids unnecessary repeated AI requests
- 🔄 **Async Processing** — supports background processing for longer operations

**API access:**

- GraphQL: `http://localhost:4000/graphql`
- AI REST endpoints: `http://localhost:5000/ai/*`

**Example request:**

```bash
curl -X POST http://localhost:5000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Analyze my system performance"}'
```

**GraphQL example:**

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

- [AI Integration Guide](docs/AI_INTEGRATION.md)
- [AI Service API](backend/ai-service/API_DOCUMENTATION.md)

## 🏥 Health Checks

Each major backend service exposes health endpoints for monitoring service availability.

- **API Gateway:** `/health`, `/health/detailed`
- **Worker Service:** `/health` — includes queue-related status information
- **AI Service:** `/health` — provides AI service availability information

Health checks are also used by the containerized environment and Kubernetes probes.

**Quick test:**

```bash
curl http://localhost:4000/health/detailed
```

📖 **Documentation:**

- [Health Checks Guide](docs/HEALTH_CHECKS.md)

## 🔐 Security & Rate Limiting

The API includes rate limiting and request protection mechanisms.

**Rate limiting:**

- Short-term request limits
- Medium-term request limits
- Long-term request limits
- Login attempt protection
- Registration protection
- AI operation limits
- Separate handling for authenticated and anonymous users
- Health check endpoints excluded from application limits

**Example limits:**

| Endpoint | Limit | Purpose |
|---|---|---|
| Login | 3/min | Brute-force protection |
| Registration | 3/5min | Spam prevention |
| AI Chat | 10/min | AI resource protection |
| AI Analysis | 5/min | Resource protection |
| Dashboard | 50/min | Standard API usage |

Requests exceeding the configured limits receive a `429 Too Many Requests` response.

**Testing:**

```bash
./scripts/test-rate-limiting.sh
```

📖 **Documentation:**

- [Rate Limiting Guide](docs/RATE_LIMITING.md)

## 📁 Project Structure

```text
microservices-dashboard/
├── backend/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── resolvers/
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── ...
│   │
│   ├── worker-service/
│   │   ├── src/
│   │   │   ├── jobs/
│   │   │   ├── services/
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── ...
│   │
│   ├── ai-service/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── services/
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── ...
│   │
│   └── common/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── tests/
│   └── Dockerfile
│
├── mobile/
│   └── ...
│
├── k8s/
├── scripts/
├── docs/
├── docker-compose.dev.yml
├── README.md
└── package.json
```

## 🛠️ Tech Stack

**Backend:** TypeScript · Node.js · NestJS · GraphQL · REST · PostgreSQL · TypeORM · Redis

**Frontend:** TypeScript · React 19 · Next.js 15 · Recharts · Chart.js

**AI:** OpenAI API · LangChain

**Infrastructure:** Docker · Docker Compose · GitHub Actions · Kubernetes

**Testing:** Jest · React Testing Library

## 🧪 Running Locally

Clone the repository:

```bash
git clone https://github.com/sasha39612/scalable-microservices-dashboard-with-ai.git
cd scalable-microservices-dashboard-with-ai
```

Install dependencies:

```bash
pnpm install
```

Start the development environment:

```bash
docker compose -f docker-compose.dev.yml up
```

PostgreSQL is not included in the development Docker Compose configuration.
The API Gateway expects PostgreSQL to be available separately through `DATABASE_URL`.

For PostgreSQL configuration, see [Remote Database Setup](docs/REMOTE_DB_SETUP.md).

Check the API Gateway:

```bash
curl http://localhost:4000/health
```

GraphQL: `http://localhost:4000/graphql`

Check the environment configuration and project documentation for required API keys and service configuration.

## 🧠 Engineering Highlights

**Service separation**

The application separates API handling, background processing, and AI functionality into dedicated services.

**Asynchronous processing**

Background jobs are handled separately from synchronous API requests, allowing longer-running operations to execute without blocking the main request flow.

**Caching**

Redis is used to cache frequently requested data and reduce unnecessary external API and AI requests.

**API design**

The API Gateway exposes both GraphQL and REST interfaces depending on the use case.

**Security**

Authentication, rate limiting, request validation, and environment-based configuration are used to protect application resources.

**Reliability**

Health endpoints provide service-level visibility and integrate with container orchestration and Kubernetes probes.

**Testing**

Backend and frontend tests are included to validate application logic, API behaviour, and UI components.

## 📌 Portfolio Highlights

- Designed a full-stack microservices architecture using NestJS and TypeScript.
- Implemented an API Gateway exposing GraphQL and REST APIs.
- Implemented background task processing with a custom in-memory queue, including priorities, retries, and exponential backoff.
- Built a dedicated AI service integrating OpenAI.
- Implemented caching for external API and AI responses.
- Added authentication and API rate limiting.
- Built a Next.js 15 / React 19 analytics dashboard.
- Added automated tests for backend and frontend functionality.
- Containerized services with Docker and added CI workflows.
- Added health checks and Kubernetes configuration.

## 🚧 Project Status

This project is primarily a portfolio and engineering demonstration focused on architecture, backend development, AI integration, testing, and infrastructure.

Some infrastructure and deployment configurations are provided as part of the project but may require environment-specific configuration before production use.

## 📄 License

See the repository license for details.
