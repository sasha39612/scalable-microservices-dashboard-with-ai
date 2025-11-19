import { Injectable, Logger } from '@nestjs/common';
import { ChatMessageDto, ChatResponseDto, InsightsRequestDto, InsightsResponseDto } from '../dto/chat.dto';
import { OpenAIService, ChatMessage } from './openai.service';
import { CacheService } from './cache.service';
import { WorkerClientService } from './worker-client.service';
import * as crypto from 'crypto';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private conversations = new Map<string, any[]>();

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly cacheService: CacheService,
    private readonly workerClient: WorkerClientService,
  ) {}

  async processChat(chatDto: ChatMessageDto): Promise<ChatResponseDto> {
    this.logger.log(`Processing chat message: ${chatDto.message.substring(0, 50)}...`);

    const conversationId = chatDto.conversationId || this.generateConversationId();
    
    // Get conversation history from cache or memory
    const history = await this.getConversationHistory(conversationId);
    history.push({ role: 'user', content: chatDto.message });

    try {
      // Check cache for similar query
      const cacheKey = this.generateCacheKey(chatDto.message, chatDto.context);
      const cachedResponse = await this.cacheService.get<{
        response: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: any;
      }>(cacheKey);

      if (cachedResponse) {
        this.logger.log('Returning cached response');
        history.push({ role: 'assistant', content: cachedResponse.response });
        await this.saveConversationHistory(conversationId, history);

        return {
          conversationId,
          response: cachedResponse.response,
          timestamp: new Date(),
          metadata: {
            ...cachedResponse.metadata,
            cached: true,
          },
        };
      }

      // Process with OpenAI if available, otherwise fallback to mock
      let response: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let metadata: any;

      if (this.openaiService.isAvailable()) {
        const systemMessage: ChatMessage = {
          role: 'system',
          content: this.buildSystemPrompt(chatDto.context),
        };

        const messages: ChatMessage[] = [
          systemMessage,
          ...history.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })),
        ];

        const completion = await this.openaiService.createChatCompletion(messages, {
          temperature: 0.7,
          maxTokens: 2000,
        });

        response = completion.content;
        metadata = {
          model: completion.model,
          tokensUsed: completion.tokensUsed,
          confidence: 0.85,
          cached: false,
        };

        // Cache the response
        await this.cacheService.set(
          cacheKey,
          { response, metadata },
          this.cacheService.getChatCacheTTL(),
        );
      } else {
        // Fallback to mock response
        this.logger.warn('OpenAI not available, using mock response');
        response = await this.generateAIResponse(chatDto.message, history, chatDto.context);
        metadata = {
          model: 'mock-ai-model',
          tokensUsed: this.estimateTokens(chatDto.message + response),
          confidence: 0.85,
          cached: false,
        };
      }

      history.push({ role: 'assistant', content: response });
      await this.saveConversationHistory(conversationId, history);

      return {
        conversationId,
        response,
        timestamp: new Date(),
        metadata,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error processing chat: ${err.message}`, err.stack);
      throw error;
    }
  }

  async generateInsights(insightsDto: InsightsRequestDto): Promise<InsightsResponseDto> {
    this.logger.log(`Generating insights for type: ${insightsDto.insightType}`);

    try {
      // Check cache first
      const cacheKey = this.generateInsightsCacheKey(insightsDto.insightType, insightsDto.data);
      const cachedInsights = await this.cacheService.get<InsightsResponseDto>(cacheKey);

      if (cachedInsights) {
        this.logger.log('Returning cached insights');
        return {
          ...cachedInsights,
          timestamp: new Date(),
        };
      }

      // Check if we should process async via Worker Service for large datasets
      const shouldProcessAsync = insightsDto.data.length > 1000 || insightsDto.async === true;

      if (shouldProcessAsync && this.workerClient.isWorkerAvailable()) {
        this.logger.log('Processing insights asynchronously via Worker Service');
        
        const jobId = await this.workerClient.createAIProcessingJob({
          type: 'insights',
          data: {
            insightType: insightsDto.insightType,
            data: insightsDto.data,
          },
        });

        if (jobId) {
          return {
            insights: {
              summary: 'Processing insights asynchronously...',
              keyFindings: [`Job ID: ${jobId}`],
              recommendations: ['Check job status for results'],
              confidence: 0.0,
            },
            visualizations: [],
            timestamp: new Date(),
            metadata: {
              jobId,
              status: 'processing',
              async: true,
            },
          };
        }
      }

      // Process with OpenAI if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let insights: any;

      if (this.openaiService.isAvailable()) {
        this.logger.log('Generating insights with OpenAI');
        
        const aiInsights = await this.openaiService.generateDataInsights(
          insightsDto.data,
          insightsDto.insightType,
          insightsDto.context,
        );

        insights = {
          summary: aiInsights.summary,
          keyFindings: aiInsights.keyFindings,
          recommendations: aiInsights.recommendations,
          confidence: aiInsights.confidence,
          visualizations: this.generateVisualizations(insightsDto.data, insightsDto.insightType),
        };
      } else {
        // Fallback to mock insights
        this.logger.warn('OpenAI not available, using mock insights');
        insights = await this.analyzeData(insightsDto.data, insightsDto.insightType);
      }

      const response: InsightsResponseDto = {
        insights: {
          summary: insights.summary,
          keyFindings: insights.keyFindings,
          recommendations: insights.recommendations,
          confidence: insights.confidence,
        },
        visualizations: insights.visualizations,
        timestamp: new Date(),
      };

      // Cache the results
      await this.cacheService.set(
        cacheKey,
        response,
        this.cacheService.getInsightsCacheTTL(),
      );

      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error generating insights: ${err.message}`, err.stack);
      throw error;
    }
  }

  async clearConversation(conversationId: string): Promise<void> {
    this.logger.log(`Clearing conversation: ${conversationId}`);
    this.conversations.delete(conversationId);
    
    // Clear from cache as well
    await this.cacheService.delete(
      this.cacheService.getConversationCacheKey(conversationId),
    );
  }

  async getConversationHistory(conversationId: string): Promise<Array<{ role: string; content: string }>> {
    // Try cache first
    const cacheKey = this.cacheService.getConversationCacheKey(conversationId);
    const cached = await this.cacheService.get<Array<{ role: string; content: string }>>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Fallback to in-memory
    return this.conversations.get(conversationId) || [];
  }

  // Private helper methods
  
  private async saveConversationHistory(
    conversationId: string,
    history: Array<{ role: string; content: string }>,
  ): Promise<void> {
    // Save to memory
    this.conversations.set(conversationId, history);
    
    // Save to cache
    const cacheKey = this.cacheService.getConversationCacheKey(conversationId);
    await this.cacheService.set(cacheKey, history, 3600); // 1 hour TTL
  }
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateAIResponse(message: string, history: any[], context?: string[]): Promise<string> {
    // Use OpenAI for actual AI integration
    const systemMessage: ChatMessage = {
      role: 'system',
      content: this.buildSystemPrompt(context),
    };

    const messages: ChatMessage[] = [
      systemMessage,
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
    ];

    try {
      const completion = await this.openaiService.createChatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 2000,
      });

      return completion.content;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error generating AI response: ${err.message}`, err.stack);
      
      // Fallback to a generic response if OpenAI fails
      return `I understand you're asking about: "${message}". ${context ? `Considering the context provided, ` : ''}I'm having trouble processing this request right now. Please try again or rephrase your question.`;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async analyzeData(data: any[], insightType: string): Promise<any> {
    // Mock insights generation - replace with actual AI analysis
    type VisualizationType = {
      type: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: any[];
    };

    const insightTemplates: Record<string, {
      summary: string;
      keyFindings: string[];
      recommendations: string[];
      confidence: number;
      visualizations: VisualizationType[];
    }> = {
      performance: {
        summary: 'System performance is stable with minor optimization opportunities.',
        keyFindings: [
          'Average response time: 250ms',
          'Peak usage hours: 2pm-5pm',
          '3% of requests exceed 1s threshold',
        ],
        recommendations: [
          'Implement caching for frequently accessed data',
          'Consider load balancing during peak hours',
          'Optimize database indexes',
        ],
        confidence: 0.88,
        visualizations: [
          {
            type: 'line',
            data: data.slice(0, 10).map((_, i) => ({ x: i, y: Math.random() * 100 })),
          },
        ],
      },
      usage: {
        summary: 'User engagement shows positive trends with seasonal variations.',
        keyFindings: [
          'Daily active users increased by 12%',
          'Average session duration: 8.5 minutes',
          'Mobile usage: 45% of total traffic',
        ],
        recommendations: [
          'Enhance mobile experience',
          'Add push notifications for engagement',
          'Create onboarding tutorials',
        ],
        confidence: 0.92,
        visualizations: [
          {
            type: 'bar',
            data: data.slice(0, 7).map((_, i) => ({ x: `Day ${i + 1}`, y: Math.random() * 1000 })),
          },
        ],
      },
      trends: {
        summary: 'Upward trends detected in key metrics with predictable patterns.',
        keyFindings: [
          'Monthly growth rate: 8%',
          'User retention: 76%',
          'Feature adoption increasing',
        ],
        recommendations: [
          'Invest in trending features',
          'Plan for infrastructure scaling',
          'Conduct user surveys',
        ],
        confidence: 0.85,
        visualizations: [] as VisualizationType[],
      },
      anomalies: {
        summary: 'Minor anomalies detected in traffic patterns.',
        keyFindings: [
          '2 unusual spikes in the last week',
          'Potential bot traffic detected',
          'Error rate within normal range',
        ],
        recommendations: [
          'Investigate traffic sources',
          'Implement rate limiting',
          'Monitor error logs closely',
        ],
        confidence: 0.79,
        visualizations: [] as VisualizationType[],
      },
      predictions: {
        summary: 'Forecast indicates steady growth with seasonal adjustments.',
        keyFindings: [
          'Expected 15% growth next quarter',
          'Peak season approaching',
          'Resource needs will increase',
        ],
        recommendations: [
          'Scale infrastructure proactively',
          'Prepare marketing campaigns',
          'Optimize costs before peak',
        ],
        confidence: 0.81,
        visualizations: [] as VisualizationType[],
      },
    };

    return insightTemplates[insightType] || insightTemplates.performance;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private generateCacheKey(message: string, context?: string[]): string {
    const contextStr = context ? context.join('|') : '';
    const hash = crypto
      .createHash('md5')
      .update(`${message}:${contextStr}`)
      .digest('hex');
    return this.cacheService.getChatCacheKey('message', hash);
  }

  private generateInsightsCacheKey(
    insightType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[],
  ): string {
    const dataHash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return this.cacheService.getInsightsCacheKey(insightType, dataHash);
  }

  private buildSystemPrompt(context?: string[]): string {
    let prompt = `You are a helpful AI assistant for a microservices dashboard platform. 
You help users understand their system metrics, analyze data, and provide actionable insights.
Be concise, accurate, and helpful. Focus on practical recommendations.`;

    if (context && context.length > 0) {
      prompt += `\n\nContext: ${context.join(', ')}`;
    }

    return prompt;
  }

  private generateVisualizations(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[],
    insightType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any[] {
    // Generate basic visualizations based on insight type
    if (data.length === 0) {
      return [];
    }

    const visualizations = [];

    switch (insightType) {
      case 'performance':
        visualizations.push({
          type: 'line',
          title: 'Performance Trend',
          data: data.slice(0, 20).map((d, i) => ({
            x: d.timestamp || i,
            y: d.value || d.responseTime || Math.random() * 100,
          })),
        });
        break;

      case 'usage':
        visualizations.push({
          type: 'bar',
          title: 'Usage Distribution',
          data: data.slice(0, 10).map((d, i) => ({
            x: d.label || d.category || `Item ${i + 1}`,
            y: d.count || d.value || Math.random() * 1000,
          })),
        });
        break;

      case 'trends':
        visualizations.push({
          type: 'area',
          title: 'Growth Trend',
          data: data.slice(0, 30).map((d, i) => ({
            x: d.date || d.timestamp || i,
            y: d.value || d.total || Math.random() * 500,
          })),
        });
        break;

      default:
        // Generic visualization
        visualizations.push({
          type: 'scatter',
          title: 'Data Overview',
          data: data.slice(0, 50).map((d, i) => ({
            x: i,
            y: d.value || Math.random() * 100,
          })),
        });
    }

    return visualizations;
  }
}
