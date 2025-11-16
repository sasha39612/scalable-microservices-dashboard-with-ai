import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AIService } from './ai.service';
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
} from './ai.model';

@Resolver()
export class AIResolver {
  constructor(private readonly aiService: AIService) {}

  @Mutation(() => ChatResponse, { description: 'Send a chat message and get AI response' })
  async chat(
    @Args('input') input: ChatRequestInput,
  ): Promise<ChatResponse> {
    return this.aiService.chat(input);
  }

  @Query(() => [Insight], { description: 'Get AI-powered insights based on data' })
  async insights(
    @Args('input') input: InsightRequestInput,
  ): Promise<Insight[]> {
    return this.aiService.getInsights(input);
  }

  @Mutation(() => AnalysisResponse, { description: 'Analyze data using AI' })
  async analyzeData(
    @Args('input') input: AnalysisRequestInput,
  ): Promise<AnalysisResponse> {
    return this.aiService.analyzeData(input);
  }

  @Query(() => RecommendationsResponse, { description: 'Get AI recommendations for a user' })
  async recommendations(
    @Args('input') input: RecommendationsRequestInput,
  ): Promise<RecommendationsResponse> {
    return this.aiService.getRecommendations(input);
  }

  @Mutation(() => SummaryResponse, { description: 'Generate a summary from text' })
  async generateSummary(
    @Args('input') input: SummaryRequestInput,
  ): Promise<SummaryResponse> {
    return this.aiService.generateSummary(input);
  }
}
