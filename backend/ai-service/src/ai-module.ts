import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AIController } from './controllers/ai.controller';
import { AIService } from './services/ai.service';

@Module({
  imports: [],
  controllers: [HealthController, AIController],
  providers: [AIService],
})
export class AIModule {}
