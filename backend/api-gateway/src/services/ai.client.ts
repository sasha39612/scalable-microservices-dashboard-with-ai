import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ChatRequest {
  messages: ChatMessage[];
  userId?: string;
  context?: Record<string, unknown>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

interface ChatResponse {
  message: string;
  role: 'assistant';
  conversationId?: string;
  tokensUsed?: number;
  model?: string;
  timestamp: Date;
}

interface InsightRequest {
  insightType: 'performance' | 'usage' | 'trends' | 'anomalies' | 'predictions';
  data: unknown[];
  context?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  data: Record<string, unknown>;
  confidence?: number;
  recommendations?: string[];
  createdAt: Date;
}

interface AnalysisRequest {
  dataType: 'metrics' | 'logs' | 'events' | 'user-behavior';
  data: unknown[];
  analysisType?: 'trend' | 'anomaly' | 'correlation' | 'classification';
  timeRange?: {
    start: Date;
    end: Date;
  };
}

interface AnalysisResponse {
  results: Record<string, unknown>;
  insights: string[];
  visualizations?: unknown[];
  confidence: number;
  processedAt: Date;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

@Injectable()
export class AIClient {
  private readonly aiServiceUrl: string;
  private readonly apiKey: string;
  private readonly logger = new Logger('AIClient');

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:5000';
    this.apiKey = process.env.AI_SERVICE_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn('AI_SERVICE_API_KEY not configured - inter-service authentication disabled');
    } else {
      this.logger.log('AI_SERVICE_API_KEY is configured');
      this.logger.debug(`API Key length: ${this.apiKey.length} chars`);
    }
    this.logger.log(`AI Service URL: ${this.aiServiceUrl}`);
  }

  private getHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...additionalHeaders,
    };
  }

  /**
   * Send a chat message and get AI response
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      this.logger.log('Sending chat request to AI service');
      
      // Transform the request to match AI service's expected format
      const lastMessage = request.messages[request.messages.length - 1];
      const aiServiceRequest = {
        message: lastMessage.content,
        conversationId: request.context?.conversationId as string | undefined,
        context: request.context ? Object.keys(request.context).map(key => `${key}: ${request.context![key]}`) : undefined,
      };
      
      this.logger.log(`Request payload: ${JSON.stringify(aiServiceRequest)}`);
      
      const response = await fetch(`${this.aiServiceUrl}/ai/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(aiServiceRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`AI service responded with status ${response.status}: ${errorText}`);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }
        throw new HttpException(
          error.message || 'Failed to get chat response',
          response.status,
        );
      }

      const aiServiceResponse = await response.json();
      this.logger.log('Chat response received successfully');
      
      // Transform the response back to the expected format
      return {
        message: aiServiceResponse.response,
        role: 'assistant',
        conversationId: aiServiceResponse.conversationId,
        tokensUsed: aiServiceResponse.metadata?.tokensUsed,
        model: aiServiceResponse.metadata?.model,
        timestamp: new Date(aiServiceResponse.timestamp),
      };
    } catch (error) {
      this.logger.error(`Chat request failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get AI-powered insights based on data
   */
  async getInsights(request: InsightRequest): Promise<Insight[]> {
    try {
      this.logger.log(`Requesting ${request.insightType} insights`);
      
      const response = await fetch(`${this.aiServiceUrl}/ai/insights`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to get insights',
          response.status,
        );
      }

      const insights = await response.json();
      this.logger.log(`Received ${insights.length} insights`);
      return insights;
    } catch (error) {
      this.logger.error(`Insights request failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Analyze data using AI
   */
  async analyzeData(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      this.logger.log(`Analyzing ${request.dataType} data (${request.data.length} items)`);
      
      const response = await fetch(`${this.aiServiceUrl}/ai/analyze`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to analyze data',
          response.status,
        );
      }

      const analysis = await response.json();
      this.logger.log('Data analysis completed successfully');
      return analysis;
    } catch (error) {
      this.logger.error(`Data analysis failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get recommendations based on user data
   */
  async getRecommendations(request: {
    userId: string;
    context: Record<string, unknown>;
    count?: number;
  }): Promise<{
    recommendations: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      confidence: number;
    }>;
  }> {
    try {
      this.logger.log(`Getting recommendations for user: ${request.userId}`);
      
      const response = await fetch(`${this.aiServiceUrl}/ai/recommendations`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to get recommendations',
          response.status,
        );
      }

      const result = await response.json();
      this.logger.log(`Received ${result.recommendations.length} recommendations`);
      return result;
    } catch (error) {
      this.logger.error(`Recommendations request failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Generate summary from text or data
   */
  async generateSummary(request: {
    content: string | Record<string, unknown>;
    type: 'text' | 'data';
    maxLength?: number;
  }): Promise<{
    summary: string;
    keyPoints: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
  }> {
    try {
      this.logger.log(`Generating ${request.type} summary`);
      
      const response = await fetch(`${this.aiServiceUrl}/api/summarize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to generate summary',
          response.status,
        );
      }

      const summary = await response.json();
      this.logger.log('Summary generated successfully');
      return summary;
    } catch (error) {
      this.logger.error(`Summary generation failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Predict trends based on historical data
   */
  async predictTrends(request: {
    metricName: string;
    historicalData: Array<{
      timestamp: Date;
      value: number;
    }>;
    predictionHorizon: number; // in days
    includeConfidenceInterval?: boolean;
  }): Promise<{
    predictions: Array<{
      timestamp: Date;
      predictedValue: number;
      confidenceInterval?: {
        lower: number;
        upper: number;
      };
    }>;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    accuracy: number;
  }> {
    try {
      this.logger.log(`Predicting trends for ${request.metricName}`);
      
      const response = await fetch(`${this.aiServiceUrl}/api/predict`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to predict trends',
          response.status,
        );
      }

      const predictions = await response.json();
      this.logger.log(`Generated ${predictions.predictions.length} predictions`);
      return predictions;
    } catch (error) {
      this.logger.error(`Trend prediction failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Detect anomalies in data
   */
  async detectAnomalies(request: {
    dataPoints: Array<{
      timestamp: Date;
      value: number;
      metadata?: Record<string, unknown>;
    }>;
    sensitivity?: 'low' | 'medium' | 'high';
  }): Promise<{
    anomalies: Array<{
      timestamp: Date;
      value: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reason: string;
      metadata?: Record<string, unknown>;
    }>;
    totalDataPoints: number;
    anomalyRate: number;
  }> {
    try {
      this.logger.log(`Detecting anomalies in ${request.dataPoints.length} data points`);
      
      const response = await fetch(`${this.aiServiceUrl}/api/anomalies`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new HttpException(
          error.message || 'Failed to detect anomalies',
          response.status,
        );
      }

      const result = await response.json();
      this.logger.log(`Detected ${result.anomalies.length} anomalies`);
      return result;
    } catch (error) {
      this.logger.error(`Anomaly detection failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(request: {
    conversationId: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    messages: ChatMessage[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams({
        conversationId: request.conversationId,
      });
      
      if (request.limit) queryParams.append('limit', request.limit.toString());
      if (request.offset) queryParams.append('offset', request.offset.toString());

      this.logger.log(`Fetching conversation history: ${request.conversationId}`);
      
      const response = await fetch(
        `${this.aiServiceUrl}/api/conversations?${queryParams.toString()}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          'Failed to fetch conversation history',
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch conversation history: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Health check for AI Service
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: Date;
    models?: string[];
  }> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/health`);
      
      if (!response.ok) {
        throw new Error('AI Service health check failed');
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`AI Service health check failed: ${getErrorMessage(error)}`);
      throw new HttpException(
        'AI Service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
