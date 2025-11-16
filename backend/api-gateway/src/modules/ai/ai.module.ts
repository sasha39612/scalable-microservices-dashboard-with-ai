import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIResolver } from './ai.resolver';
import { AIClient } from '../../services/ai.client';

@Module({
  providers: [AIService, AIResolver, AIClient],
  exports: [AIService],
})
export class AIModule {}
