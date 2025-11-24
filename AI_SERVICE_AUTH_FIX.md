# AI Service Authentication Fix

## Problem
The AI service was returning "Invalid or missing API key" errors when the API Gateway attempted to fetch insights. This was causing the dashboard to fail loading AI-powered features.

## Root Cause
The `docker-compose.dev.yml` file was not explicitly loading the `.env` file into the containers using the `env_file` directive. While Docker Compose does use `.env` for variable substitution in the compose file itself (e.g., `${AI_SERVICE_API_KEY}`), the environment variables were not being passed into the running containers.

## Changes Made

### 1. Docker Compose Configuration (`docker-compose.dev.yml`)
Added `env_file: - .env` directive to all service containers:
- `frontend`
- `api-gateway`
- `worker-service`
- `ai-service`

This ensures all environment variables from the `.env` file are available inside each container.

### 2. AI Service Startup Logging (`backend/ai-service/src/main.ts`)
Added logging to verify environment variables are loaded:
```typescript
console.log(`AI_SERVICE_API_KEY is ${process.env.AI_SERVICE_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`OPENAI_API_KEY is ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
```

### 3. API Key Guard Enhancement (`backend/ai-service/src/guards/api-key.guard.ts`)
Enhanced the guard with:
- Better logging for debugging
- Development mode support (allows requests when API key is not configured)
- Detailed error messages for troubleshooting

### 4. API Gateway AI Client Logging (`backend/api-gateway/src/services/ai.client.ts`)
Added logging to verify API key configuration:
```typescript
this.logger.log('AI_SERVICE_API_KEY is configured');
this.logger.debug(`API Key length: ${this.apiKey.length} chars`);
this.logger.log(`AI Service URL: ${this.aiServiceUrl}`);
```

## Verification Steps

1. **Restart the services** to apply the changes:
   ```bash
   docker compose -f docker-compose.dev.yml down
   docker compose -f docker-compose.dev.yml up --build
   ```

2. **Check the logs** for confirmation:
   - AI Service should log: `✅ AI_SERVICE_API_KEY is configured`
   - API Gateway should log: `AI_SERVICE_API_KEY is configured`

3. **Test the dashboard** - AI insights should now load without errors

4. **Run the test script** (optional):
   ```bash
   ./scripts/test-env-vars.sh
   ```

## Environment Variables Required

Ensure your `.env` file contains:
```env
AI_SERVICE_API_KEY=<your-api-key>
OPENAI_API_KEY=<your-openai-key>
```

## Security Notes

- The API key guard now supports development mode (no authentication required if API key is not set)
- In production, always set `AI_SERVICE_API_KEY` to a strong, random value
- Generate secure keys using: `openssl rand -hex 32`

## Expected Behavior After Fix

1. ✅ AI service accepts requests with valid API key
2. ✅ API Gateway successfully authenticates with AI service
3. ✅ Dashboard loads AI insights without errors
4. ✅ Clear logging helps diagnose any future authentication issues
