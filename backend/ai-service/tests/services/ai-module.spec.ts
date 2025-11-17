import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from '../../src/services/ai.service';
import { OpenAIService } from '../../src/services/openai.service';
import { CacheService } from '../../src/services/cache.service';
import { WorkerClientService } from '../../src/services/worker-client.service';
import { ChatMessageDto, InsightsRequestDto } from '../../src/dto/chat.dto';

describe('AIService (AI Module)', () => {
  let service: AIService;

  const mockOpenAIService = {
    isAvailable: jest.fn().mockReturnValue(false),
    createChatCompletion: jest.fn(),
    generateDataInsights: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    getChatCacheTTL: jest.fn().mockReturnValue(3600),
    getInsightsCacheTTL: jest.fn().mockReturnValue(7200),
    getChatCacheKey: jest.fn((conversationId: string, messageHash: string) => 
      `chat:${conversationId}:${messageHash}`),
    getInsightsCacheKey: jest.fn((insightType: string, dataHash: string) => 
      `insights:${insightType}:${dataHash}`),
    getConversationCacheKey: jest.fn((conversationId: string) => 
      `conversation:${conversationId}`),
  };

  const mockWorkerClientService = {
    isWorkerAvailable: jest.fn().mockReturnValue(false),
    createAIProcessingJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: WorkerClientService,
          useValue: mockWorkerClientService,
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);

    // Reset mocks
    jest.clearAllMocks();
    
    // Reset mock implementations to default
    mockOpenAIService.isAvailable.mockReturnValue(false);
    mockCacheService.get.mockResolvedValue(null);
    mockWorkerClientService.isWorkerAvailable.mockReturnValue(false);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processChat', () => {
    it('should process chat message and return response', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Hello, AI!',
      };

      const result = await service.processChat(chatDto);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.conversationId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.metadata).toBeDefined();
    });

    it('should generate conversation ID when not provided', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      const result = await service.processChat(chatDto);

      expect(result.conversationId).toMatch(/^conv_\d+_[a-z0-9]+$/);
    });

    it('should use provided conversation ID', async () => {
      const conversationId = 'test-conv-123';
      const chatDto: ChatMessageDto = {
        message: 'Test message',
        conversationId,
      };

      const result = await service.processChat(chatDto);

      expect(result.conversationId).toBe(conversationId);
    });

    it('should maintain conversation history', async () => {
      const chatDto1: ChatMessageDto = {
        message: 'First message',
      };

      const result1 = await service.processChat(chatDto1);
      const conversationId = result1.conversationId;

      const chatDto2: ChatMessageDto = {
        message: 'Second message',
        conversationId,
      };

      await service.processChat(chatDto2);

      const history = await service.getConversationHistory(conversationId);
      
      expect(history.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant messages
      expect(history.some(h => h.content === 'First message')).toBe(true);
      expect(history.some(h => h.content === 'Second message')).toBe(true);
    });

    it('should return cached response when available', async () => {
      const cachedResponse = {
        response: 'Cached answer',
        metadata: { cached: true, model: 'cache' },
      };

      // First call returns null (for conversation history), second call returns cached response
      mockCacheService.get
        .mockResolvedValueOnce(null) // conversation history
        .mockResolvedValueOnce(cachedResponse); // cached chat response

      const chatDto: ChatMessageDto = {
        message: 'What is performance?',
      };

      const result = await service.processChat(chatDto);

      expect(result.response).toBe('Cached answer');
      expect(result.metadata?.cached).toBe(true);
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should cache new responses', async () => {
      const chatDto: ChatMessageDto = {
        message: 'New question',
      };

      await service.processChat(chatDto);

      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should handle context in chat messages', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Analyze this',
        context: ['performance', 'metrics'],
      };

      const result = await service.processChat(chatDto);

      expect(result).toBeDefined();
      expect(result.response).toBeTruthy();
    });

    it('should use OpenAI when available', async () => {
      mockOpenAIService.isAvailable.mockReturnValue(true);
      mockOpenAIService.createChatCompletion.mockResolvedValue({
        content: 'OpenAI response',
        model: 'gpt-4',
        tokensUsed: 150,
      });

      const chatDto: ChatMessageDto = {
        message: 'Test OpenAI',
      };

      const result = await service.processChat(chatDto);

      expect(mockOpenAIService.createChatCompletion).toHaveBeenCalled();
      expect(result.response).toBe('OpenAI response');
      expect(result.metadata?.model).toBe('gpt-4');
    });

    it('should fallback to mock when OpenAI unavailable', async () => {
      mockOpenAIService.isAvailable.mockReturnValue(false);

      const chatDto: ChatMessageDto = {
        message: 'Hello',
      };

      const result = await service.processChat(chatDto);

      expect(result.response).toBeDefined();
      expect(result.metadata?.model).toBe('mock-ai-model');
    });

    it('should handle greeting messages', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Hello',
      };

      const result = await service.processChat(chatDto);

      expect(result.response).toContain('Hello');
    });

    it('should handle performance-related queries', async () => {
      const chatDto: ChatMessageDto = {
        message: 'What is the system performance?',
      };

      const result = await service.processChat(chatDto);

      expect(result.response).toContain('performance');
    });

    it('should handle analytics queries', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Show me the analytics data',
      };

      const result = await service.processChat(chatDto);

      expect(result.response).toContain('analytics');
    });

    it('should estimate tokens correctly', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Short message',
      };

      const result = await service.processChat(chatDto);

      expect(result.metadata?.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate performance insights', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [
          { metric: 'cpu', value: 75, timestamp: new Date() },
          { metric: 'memory', value: 60, timestamp: new Date() },
        ],
        insightType: 'performance',
      };

      const result = await service.generateInsights(insightsDto);

      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.insights.summary).toBeTruthy();
      expect(result.insights.keyFindings).toBeInstanceOf(Array);
      expect(result.insights.recommendations).toBeInstanceOf(Array);
      expect(result.insights.confidence).toBeGreaterThan(0);
    });

    it('should generate usage insights', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [
          { users: 100, date: '2024-01-01' },
          { users: 150, date: '2024-01-02' },
        ],
        insightType: 'usage',
      };

      const result = await service.generateInsights(insightsDto);

      expect(result.insights.summary).toContain('engagement');
      expect(result.insights.keyFindings.length).toBeGreaterThan(0);
    });

    it('should generate trend insights', async () => {
      const insightsDto: InsightsRequestDto = {
        data: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(2024, 0, i + 1),
          value: i * 10,
        })),
        insightType: 'trends',
      };

      const result = await service.generateInsights(insightsDto);

      expect(result.insights.summary).toContain('trend');
      expect(result.insights.confidence).toBeGreaterThan(0.5);
    });

    it('should generate anomaly insights', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [
          { value: 100 },
          { value: 105 },
          { value: 1000 }, // anomaly
          { value: 102 },
        ],
        insightType: 'anomalies',
      };

      const result = await service.generateInsights(insightsDto);

      expect(result.insights.summary).toContain('anomal');
    });

    it('should generate prediction insights', async () => {
      const insightsDto: InsightsRequestDto = {
        data: Array.from({ length: 90 }, (_, i) => ({
          date: new Date(2024, 0, i + 1),
          value: i * 2,
        })),
        insightType: 'predictions',
      };

      const result = await service.generateInsights(insightsDto);

      expect(result.insights.summary).toContain('Forecast');
      expect(result.insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should return cached insights when available', async () => {
      const cachedInsights = {
        insights: {
          summary: 'Cached insights',
          keyFindings: ['Finding 1'],
          recommendations: ['Recommendation 1'],
          confidence: 0.9,
        },
        visualizations: [] as never[],
        timestamp: new Date(),
      };

      mockCacheService.get.mockResolvedValueOnce(cachedInsights);

      const insightsDto: InsightsRequestDto = {
        data: [{ value: 1 }],
        insightType: 'performance',
      };

      const result = await service.generateInsights(insightsDto);

      expect(result.insights.summary).toBe('Cached insights');
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should cache new insights', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [{ value: 1 }],
        insightType: 'performance',
      };

      await service.generateInsights(insightsDto);

      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should use Worker Service for large datasets', async () => {
      mockWorkerClientService.isWorkerAvailable.mockReturnValue(true);
      mockWorkerClientService.createAIProcessingJob.mockResolvedValue('job-123');

      const largeData = Array.from({ length: 1500 }, (_, i) => ({ value: i }));
      const insightsDto: InsightsRequestDto = {
        data: largeData,
        insightType: 'performance',
      };

      const result = await service.generateInsights(insightsDto);

      expect(mockWorkerClientService.createAIProcessingJob).toHaveBeenCalled();
      expect(result.metadata?.jobId).toBe('job-123');
      expect(result.metadata?.async).toBe(true);
    });

    it('should process async when explicitly requested', async () => {
      mockWorkerClientService.isWorkerAvailable.mockReturnValue(true);
      mockWorkerClientService.createAIProcessingJob.mockResolvedValue('job-456');

      const insightsDto: InsightsRequestDto = {
        data: [{ value: 1 }],
        insightType: 'performance',
        async: true,
      };

      const result = await service.generateInsights(insightsDto);

      expect(result.metadata?.jobId).toBe('job-456');
      expect(result.metadata?.status).toBe('processing');
    });

    it('should use OpenAI for insights when available', async () => {
      mockOpenAIService.isAvailable.mockReturnValue(true);
      mockOpenAIService.generateDataInsights.mockResolvedValue({
        summary: 'AI-generated summary',
        keyFindings: ['AI finding 1', 'AI finding 2'],
        recommendations: ['AI recommendation'],
        confidence: 0.95,
      });

      const insightsDto: InsightsRequestDto = {
        data: [{ value: 100 }],
        insightType: 'performance',
      };

      const result = await service.generateInsights(insightsDto);

      expect(mockOpenAIService.generateDataInsights).toHaveBeenCalled();
      expect(result.insights.summary).toBe('AI-generated summary');
      expect(result.insights.confidence).toBe(0.95);
    });

    it('should generate visualizations', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
          { x: 3, y: 30 },
        ],
        insightType: 'performance',
      };

      const result = await service.generateInsights(insightsDto);

      expect(result.visualizations).toBeDefined();
      if (result.visualizations && result.visualizations.length > 0) {
        expect(result.visualizations[0]).toHaveProperty('type');
        expect(result.visualizations[0]).toHaveProperty('data');
      }
    });

    it('should handle insights with time range', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [{ value: 1 }],
        insightType: 'performance',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      const result = await service.generateInsights(insightsDto);

      expect(result).toBeDefined();
    });

    it('should handle insights with context', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [{ value: 1 }],
        insightType: 'performance',
        context: 'High traffic period',
      };

      const result = await service.generateInsights(insightsDto);

      expect(result).toBeDefined();
    });
  });

  describe('conversation management', () => {
    it('should retrieve conversation history', async () => {
      const chatDto: ChatMessageDto = {
        message: 'First message',
      };

      const result = await service.processChat(chatDto);
      const conversationId = result.conversationId;

      const history = await service.getConversationHistory(conversationId);

      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent conversation', async () => {
      const history = await service.getConversationHistory('non-existent-id');

      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(0);
    });

    it('should clear conversation history', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      const result = await service.processChat(chatDto);
      const conversationId = result.conversationId;

      await service.clearConversation(conversationId);

      const history = await service.getConversationHistory(conversationId);
      expect(history.length).toBe(0);
    });

    it('should save conversation to cache', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      await service.processChat(chatDto);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('conversation:'),
        expect.any(Array),
        expect.any(Number),
      );
    });

    it('should retrieve conversation from cache', async () => {
      const cachedHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      mockCacheService.get.mockResolvedValueOnce(cachedHistory);

      const history = await service.getConversationHistory('test-conv-id');

      expect(history).toEqual(cachedHistory);
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should clear conversation from cache', async () => {
      await service.clearConversation('test-conv-id');

      expect(mockCacheService.delete).toHaveBeenCalledWith(
        expect.stringContaining('conversation:test-conv-id'),
      );
    });
  });

  describe('error handling', () => {
    it('should handle OpenAI errors gracefully', async () => {
      mockOpenAIService.isAvailable.mockReturnValue(true);
      mockOpenAIService.createChatCompletion.mockRejectedValue(
        new Error('OpenAI API error'),
      );

      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      await expect(service.processChat(chatDto)).rejects.toThrow('OpenAI API error');
    });

    it('should handle cache errors gracefully', async () => {
      const getError = new Error('Cache error');
      mockCacheService.get.mockRejectedValueOnce(getError);

      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      // Should still throw since cache is critical
      await expect(service.processChat(chatDto)).rejects.toThrow('Cache error');
      
      // Reset the mock for subsequent tests
      mockCacheService.get.mockResolvedValue(null);
    });

    it('should handle Worker Service errors gracefully', async () => {
      mockWorkerClientService.isWorkerAvailable.mockReturnValue(true);
      mockWorkerClientService.createAIProcessingJob.mockResolvedValue(null);

      const largeData = Array.from({ length: 1500 }, (_, i) => ({ value: i }));
      const insightsDto: InsightsRequestDto = {
        data: largeData,
        insightType: 'performance',
      };

      const result = await service.generateInsights(insightsDto);

      // Should fallback to sync processing
      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should handle insights generation errors', async () => {
      // Reset cache mock first
      mockCacheService.get.mockResolvedValue(null);
      
      mockOpenAIService.isAvailable.mockReturnValue(true);
      mockOpenAIService.generateDataInsights.mockRejectedValue(
        new Error('Insights generation failed'),
      );

      const insightsDto: InsightsRequestDto = {
        data: [{ value: 1 }],
        insightType: 'performance',
      };

      await expect(service.generateInsights(insightsDto)).rejects.toThrow(
        'Insights generation failed',
      );
    });
  });

  describe('cache key generation', () => {
    it('should generate consistent cache keys for same inputs', async () => {
      const chatDto1: ChatMessageDto = {
        message: 'Same message',
        context: ['context1'],
      };

      const chatDto2: ChatMessageDto = {
        message: 'Same message',
        context: ['context1'],
      };

      await service.processChat(chatDto1);
      const firstCallKey = mockCacheService.get.mock.calls[1][0]; // Second call is for chat cache

      jest.clearAllMocks();
      mockCacheService.get.mockResolvedValue(null);

      await service.processChat(chatDto2);
      const secondCallKey = mockCacheService.get.mock.calls[1][0]; // Second call is for chat cache

      expect(firstCallKey).toBe(secondCallKey);
    });

    it('should generate different cache keys for different inputs', async () => {
      const chatDto1: ChatMessageDto = {
        message: 'Message 1',
      };

      const chatDto2: ChatMessageDto = {
        message: 'Message 2',
      };

      await service.processChat(chatDto1);
      const firstCallKey = mockCacheService.get.mock.calls[1][0]; // Second call is for chat cache

      jest.clearAllMocks();
      mockCacheService.get.mockResolvedValue(null);

      await service.processChat(chatDto2);
      const secondCallKey = mockCacheService.get.mock.calls[1][0]; // Second call is for chat cache

      expect(firstCallKey).not.toBe(secondCallKey);
    });
  });

  describe('metadata handling', () => {
    it('should include correct metadata in responses', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Test',
      };

      const result = await service.processChat(chatDto);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.model).toBeDefined();
      expect(result.metadata?.tokensUsed).toBeGreaterThan(0);
      expect(result.metadata?.confidence).toBeGreaterThan(0);
      expect(result.metadata?.cached).toBe(false);
    });

    it('should mark cached responses in metadata', async () => {
      const cachedResponse = {
        response: 'Cached',
        metadata: { model: 'cache', cached: true },
      };

      // First call returns null (for conversation history), second call returns cached response
      mockCacheService.get
        .mockResolvedValueOnce(null) // conversation history
        .mockResolvedValueOnce(cachedResponse); // cached chat response

      const chatDto: ChatMessageDto = {
        message: 'Test',
      };

      const result = await service.processChat(chatDto);

      expect(result.metadata?.cached).toBe(true);
    });
  });
});
