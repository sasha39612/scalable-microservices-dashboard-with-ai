import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health.controller';
import { AIController } from './controllers/ai.controller';
import { AIService } from './services/ai.service';
import { OpenAIService } from './services/openai.service';
import { CacheService } from './services/cache.service';
import { WorkerClientService } from './services/worker-client.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [],
  controllers: [HealthController, AIController],
  providers: [
    AIService,
    OpenAIService,
    CacheService,
    WorkerClientService,
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
