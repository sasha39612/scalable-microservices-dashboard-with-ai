import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AIController } from './controllers/ai.controller';
import { AIService } from './services/ai.service';
import { OpenAIService } from './services/openai.service';
import { CacheService } from './services/cache.service';
import { WorkerClientService } from './services/worker-client.service';

@Module({
  imports: [],
  controllers: [HealthController, AIController],
  providers: [
    AIService,
    OpenAIService,
    CacheService,
    WorkerClientService,
  ],
  exports: [
    AIService,
    OpenAIService,
    CacheService,
    WorkerClientService,
  ],
})
export class AIModule {}
