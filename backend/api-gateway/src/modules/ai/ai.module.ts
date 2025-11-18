import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from './ai.service';
import { AIResolver } from './ai.resolver';
import { AIClient } from '../../services/ai.client';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage])],
  providers: [AIService, AIResolver, AIClient],
  exports: [AIService],
})
export class AIModule {}
