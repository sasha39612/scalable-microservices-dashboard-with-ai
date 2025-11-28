import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';
import { AIController } from './controllers/ai.controller';
import { AIService } from './services/ai.service';
import { OpenAIService } from './services/openai.service';
import { CacheService } from './services/cache.service';
import { WorkerClientService } from './services/worker-client.service';
import { AuditLoggerInitializer } from './services/audit-logger-initializer';
import { ApiKeyGuard } from './guards/api-key.guard';
import { AIAuditInterceptor } from './interceptors/ai-audit.interceptor';

@Module({
  imports: [],
  controllers: [HealthController, AIController],
  providers: [
    AIService,
    OpenAIService,
    CacheService,
    WorkerClientService,
    AuditLoggerInitializer,
    // Apply audit logging globally
    {
      provide: APP_INTERCEPTOR,
      useClass: AIAuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
  exports: [
    AIService,
    OpenAIService,
    CacheService,
    WorkerClientService,
  ],
})
export class AIModule {}
