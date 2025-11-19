import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI;
  private readonly defaultModel = 'gpt-3.5-turbo';
  private readonly defaultTemperature = 0.7;
  private readonly defaultMaxTokens = 2000;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found. OpenAI integration will not work.');
      // Create a dummy client to prevent crashes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.client = null as any;
    } else {
      this.client = new OpenAI({
        apiKey,
      });
      this.logger.log('OpenAI client initialized successfully');
    }
  }

  /**
   * Generate a chat completion using OpenAI
   */
  async createChatCompletion(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<{ content: string; tokensUsed: number; model: string }> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages,
        temperature: options.temperature ?? this.defaultTemperature,
        max_tokens: options.maxTokens || this.defaultMaxTokens,
        stream: false,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      this.logger.log(`OpenAI completion generated. Tokens used: ${tokensUsed}`);

      return {
        content,
        tokensUsed,
        model: completion.model,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`OpenAI API error: ${err.message}`, err.stack);
      throw new Error(`Failed to generate completion: ${err.message}`);
    }
  }

  /**
   * Generate insights from data using OpenAI
   */
  async generateDataInsights(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[],
    insightType: string,
    context?: string,
  ): Promise<{
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    confidence: number;
  }> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
    }

    const systemPrompt = this.buildInsightsSystemPrompt(insightType);
    const userPrompt = this.buildInsightsUserPrompt(data, insightType, context);

    try {
      const response = await this.createChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: 'gpt-4-turbo-preview',
          temperature: 0.5, // Lower temperature for more consistent insights
          maxTokens: 3000,
        },
      );

      // Parse the structured response
      const insights = this.parseInsightsResponse(response.content);
      
      return insights;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to generate insights: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Generate embeddings for semantic search or similarity
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
    }

    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create embedding: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Stream chat completions for real-time responses
   */
  async *streamChatCompletion(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages,
        temperature: options.temperature ?? this.defaultTemperature,
        max_tokens: options.maxTokens || this.defaultMaxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`OpenAI streaming error: ${err.message}`, err.stack);
      throw new Error(`Failed to stream completion: ${err.message}`);
    }
  }

  // Private helper methods

  private buildInsightsSystemPrompt(insightType: string): string {
    const basePrompt = `You are an expert data analyst specialized in generating actionable insights from system metrics and user data.
Your task is to analyze the provided data and generate insights in the following JSON format:
{
  "summary": "A concise 2-3 sentence overview of the key findings",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "confidence": 0.85
}`;

    const typeSpecificPrompts: Record<string, string> = {
      performance: `${basePrompt}\nFocus on system performance metrics, response times, throughput, and resource utilization. Identify bottlenecks and optimization opportunities.`,
      usage: `${basePrompt}\nFocus on user engagement patterns, feature adoption, session metrics, and user behavior trends.`,
      trends: `${basePrompt}\nFocus on identifying patterns over time, growth trajectories, seasonality, and predictive indicators.`,
      anomalies: `${basePrompt}\nFocus on detecting unusual patterns, outliers, potential issues, and security concerns.`,
      predictions: `${basePrompt}\nFocus on forecasting future trends, capacity planning, and resource projections.`,
    };

    return typeSpecificPrompts[insightType] || basePrompt;
  }

  private buildInsightsUserPrompt(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[],
    insightType: string,
    context?: string,
  ): string {
    const dataSnapshot = JSON.stringify(data.slice(0, 100), null, 2); // Limit data size
    const dataSize = data.length;

    let prompt = `Analyze the following data (${dataSize} data points, showing first 100):\n\n${dataSnapshot}\n\n`;
    
    if (context) {
      prompt += `Additional context: ${context}\n\n`;
    }

    prompt += `Please provide insights of type "${insightType}" following the specified JSON format.`;

    return prompt;
  }

  private parseInsightsResponse(response: string): {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    confidence: number;
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'No summary available',
          keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
        };
      }

      // Fallback: parse unstructured response
      this.logger.warn('Could not parse structured JSON response, using fallback parsing');
      return {
        summary: response.substring(0, 200),
        keyFindings: ['Analysis completed - see summary for details'],
        recommendations: ['Review the detailed analysis'],
        confidence: 0.6,
      };
    } catch (error) {
      this.logger.error('Failed to parse insights response', error);
      return {
        summary: 'Failed to parse AI response',
        keyFindings: [],
        recommendations: [],
        confidence: 0.0,
      };
    }
  }

  /**
   * Check if OpenAI client is properly initialized
   */
  isAvailable(): boolean {
    return this.client !== null;
  }
}
