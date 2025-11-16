import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AIService {
  constructor(private readonly aiClient: AIClient) {}

  async chat(input: ChatRequestInput): Promise<ChatResponse> {
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

    return {
      ...response,
      role: response.role as MessageRole,
    };
  }

  async getInsights(input: InsightRequestInput): Promise<Insight[]> {
    return this.aiClient.getInsights({
      type: input.type,
      data: input.data,
      userId: input.userId,
      context: input.context,
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
