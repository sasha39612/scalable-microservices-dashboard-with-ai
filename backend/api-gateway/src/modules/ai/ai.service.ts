import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIClient } from '../../services/ai.client';
import {
  ChatResponse,
  ChatRequestInput,
  Insight,
  InsightRequestInput,
  AnalysisResponse,
  AnalysisRequestInput,
  RecommendationsResponse,
  RecommendationsRequestInput,
  SummaryResponse,
  SummaryRequestInput,
  MessageRole,
  RecommendationPriority,
} from './ai.model';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class AIService {
  constructor(
    private readonly aiClient: AIClient,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async chat(input: ChatRequestInput): Promise<ChatResponse> {
    // Save user message to database
    if (input.userId) {
      await this.chatMessageRepository.save({
        conversationId: input.context?.conversationId as string | undefined,
        role: MessageRole.USER,
        content: input.messages[input.messages.length - 1].content,
        userId: input.userId,
      });
    }

    const response = await this.aiClient.chat({
      messages: input.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      userId: input.userId,
      context: input.context,
      options: input.options ? {
        temperature: input.options.temperature,
        maxTokens: input.options.maxTokens,
        model: input.options.model,
      } : undefined,
    });

    // Save assistant response to database
    if (input.userId && response.conversationId) {
      await this.chatMessageRepository.save({
        conversationId: response.conversationId,
        role: MessageRole.ASSISTANT,
        content: response.message,
        userId: input.userId,
      });
    }

    return {
      ...response,
      role: response.role as MessageRole,
    };
  }

  async getChatHistory(userId: string, conversationId?: string): Promise<ChatMessage[]> {
    const query = this.chatMessageRepository
      .createQueryBuilder('message')
      .where('message.userId = :userId', { userId })
      .orderBy('message.timestamp', 'ASC');

    if (conversationId) {
      query.andWhere('message.conversationId = :conversationId', { conversationId });
    }

    return query.getMany();
  }

  async getInsights(input: InsightRequestInput): Promise<Insight[]> {
    return this.aiClient.getInsights({
      insightType: input.type as 'performance' | 'usage' | 'trends' | 'anomalies' | 'predictions',
      data: Array.isArray(input.data) ? input.data : [input.data],
      context: typeof input.context === 'string' ? input.context : JSON.stringify(input.context),
    });
  }

  async analyzeData(input: AnalysisRequestInput): Promise<AnalysisResponse> {
    return this.aiClient.analyzeData({
      dataType: input.dataType,
      data: input.data,
      analysisType: input.analysisType,
      timeRange: input.timeRange ? {
        start: input.timeRange.start,
        end: input.timeRange.end,
      } : undefined,
    });
  }

  async getRecommendations(input: RecommendationsRequestInput): Promise<RecommendationsResponse> {
    const response = await this.aiClient.getRecommendations({
      userId: input.userId,
      context: input.context,
      count: input.count,
    });

    return {
      recommendations: response.recommendations.map(rec => ({
        ...rec,
        priority: rec.priority as RecommendationPriority,
      })),
    };
  }

  async generateSummary(input: SummaryRequestInput): Promise<SummaryResponse> {
    const response = await this.aiClient.generateSummary({
      content: input.text,
      type: 'text',
      maxLength: input.maxLength,
    });

    return {
      ...response,
      wordCount: input.text.split(/\s+/).length,
    };
  }
}
