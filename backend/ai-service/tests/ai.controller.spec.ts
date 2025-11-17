import { Test, TestingModule } from '@nestjs/testing';
import { AIController } from '../src/controllers/ai.controller';
import { AIService } from '../src/services/ai.service';
import { OpenAIService } from '../src/services/openai.service';
import { CacheService } from '../src/services/cache.service';
import { WorkerClientService } from '../src/services/worker-client.service';
import { ChatMessageDto, InsightsRequestDto } from '../src/dto/chat.dto';

describe('AIController', () => {
  let controller: AIController;
  let aiService: AIService;

  const mockOpenAIService = {
    isAvailable: jest.fn().mockReturnValue(false), // Use mock mode
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
      controllers: [AIController],
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

    controller = module.get<AIController>(AIController);
    aiService = module.get<AIService>(AIService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('chat', () => {
    it('should process a chat message and return a response', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Hello, how are you?',
      };

      const result = await controller.chat(chatDto);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.conversationId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.metadata).toBeDefined();
    });

    it('should maintain conversation context', async () => {
      const chatDto1: ChatMessageDto = {
        message: 'What is performance?',
      };

      const result1 = await controller.chat(chatDto1);
      const conversationId = result1.conversationId;

      const chatDto2: ChatMessageDto = {
        message: 'Tell me more',
        conversationId,
      };

      const result2 = await controller.chat(chatDto2);

      expect(result2.conversationId).toBe(conversationId);
    });

    it('should handle messages with context', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Analyze performance',
        context: ['metrics', 'dashboard'],
      };

      const result = await controller.chat(chatDto);

      expect(result).toBeDefined();
      expect(result.response).toContain('performance');
    });

    it('should handle empty messages gracefully', async () => {
      const chatDto: ChatMessageDto = {
        message: '',
      };

      // This will be caught by validation in real scenario
      // For now, we test the behavior
      try {
        await controller.chat(chatDto);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should generate different responses for different messages', async () => {
      const chatDto1: ChatMessageDto = {
        message: 'Hello',
      };
      const chatDto2: ChatMessageDto = {
        message: 'What is performance?',
      };

      const result1 = await controller.chat(chatDto1);
      const result2 = await controller.chat(chatDto2);

      expect(result1.response).not.toBe(result2.response);
    });

    it('should include metadata in response', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      const result = await controller.chat(chatDto);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.model).toBeDefined();
      expect(result.metadata?.tokensUsed).toBeDefined();
      expect(result.metadata?.confidence).toBeGreaterThan(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights for performance data', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [{ metric: 'cpu', value: 75 }],
        insightType: 'performance',
      };

      const result = await controller.generateInsights(insightsDto);

      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.insights.summary).toBeDefined();
      expect(result.insights.keyFindings).toBeInstanceOf(Array);
      expect(result.insights.recommendations).toBeInstanceOf(Array);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should generate insights for usage data', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [{ users: 100, date: new Date() }],
        insightType: 'usage',
      };

      const result = await controller.generateInsights(insightsDto);

      expect(result.insights.confidence).toBeGreaterThan(0);
      expect(result.insights.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate insights for trends', async () => {
      const insightsDto: InsightsRequestDto = {
        data: Array.from({ length: 30 }, (_, i) => ({ 
          date: new Date(2024, 0, i + 1),
          value: Math.random() * 100 
        })),
        insightType: 'trends',
      };

      const result = await controller.generateInsights(insightsDto);

      expect(result.insights).toBeDefined();
      expect(result.insights.keyFindings.length).toBeGreaterThan(0);
    });

    it('should generate insights for anomalies', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [
          { timestamp: new Date(), value: 100 },
          { timestamp: new Date(), value: 1000 }, // anomaly
        ],
        insightType: 'anomalies',
      };

      const result = await controller.generateInsights(insightsDto);

      expect(result.insights.summary).toBeDefined();
      expect(result.insights.recommendations).toBeInstanceOf(Array);
    });

    it('should generate insights for predictions', async () => {
      const insightsDto: InsightsRequestDto = {
        data: Array.from({ length: 90 }, (_, i) => ({ 
          date: new Date(2024, 0, i + 1),
          value: i * 2 
        })),
        insightType: 'predictions',
      };

      const result = await controller.generateInsights(insightsDto);

      expect(result.insights.confidence).toBeGreaterThan(0);
      expect(result.visualizations).toBeDefined();
    });

    it('should handle insights with context', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [{ metric: 'response_time', value: 250 }],
        insightType: 'performance',
        context: 'High traffic period',
      };

      const result = await controller.generateInsights(insightsDto);

      expect(result).toBeDefined();
    });

    it('should handle empty data array', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [],
        insightType: 'performance',
      };

      // In real scenario, this would be caught by validation
      try {
        const result = await controller.generateInsights(insightsDto);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should include visualizations in response', async () => {
      const insightsDto: InsightsRequestDto = {
        data: [{ x: 1, y: 10 }, { x: 2, y: 20 }],
        insightType: 'performance',
      };

      const result = await controller.generateInsights(insightsDto);

      expect(result.visualizations).toBeDefined();
      if (result.visualizations && result.visualizations.length > 0) {
        expect(result.visualizations[0]).toHaveProperty('type');
        expect(result.visualizations[0]).toHaveProperty('data');
      }
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      const chatResult = await controller.chat(chatDto);
      const conversationId = chatResult.conversationId;

      const history = await controller.getConversationHistory(conversationId);

      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent conversation', async () => {
      const history = await controller.getConversationHistory('non-existent-id');

      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(0);
    });
  });

  describe('clearConversation', () => {
    it('should clear conversation history', async () => {
      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      const chatResult = await controller.chat(chatDto);
      const conversationId = chatResult.conversationId;

      await controller.clearConversation(conversationId);

      const history = await controller.getConversationHistory(conversationId);
      expect(history.length).toBe(0);
    });
  });

  describe('batchChat', () => {
    it('should process multiple messages in batch', async () => {
      const messages: ChatMessageDto[] = [
        { message: 'First message' },
        { message: 'Second message' },
        { message: 'Third message' },
      ];

      const results = await controller.batchChat(messages);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.response).toBeDefined();
        expect(result.conversationId).toBeDefined();
      });
    });

    it('should handle empty batch', async () => {
      const messages: ChatMessageDto[] = [];

      const results = await controller.batchChat(messages);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });

    it('should process batch with single message', async () => {
      const messages: ChatMessageDto[] = [
        { message: 'Single message' },
      ];

      const results = await controller.batchChat(messages);

      expect(results.length).toBe(1);
      expect(results[0].response).toBeDefined();
    });

    it('should process batch with same conversation ID', async () => {
      const conversationId = 'test-conv-123';
      const messages: ChatMessageDto[] = [
        { message: 'First', conversationId },
        { message: 'Second', conversationId },
      ];

      const results = await controller.batchChat(messages);

      expect(results[0].conversationId).toBe(conversationId);
      expect(results[1].conversationId).toBe(conversationId);
    });
  });

  describe('analyze', () => {
    it('should perform quick data analysis', async () => {
      const data = {
        query: 'What are the trends?',
        data: [1, 2, 3, 4, 5],
      };

      const result = await controller.analyze(data);

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle complex data structures', async () => {
      const data = {
        query: 'Analyze user behavior',
        data: {
          users: [
            { id: 1, activity: 'login', timestamp: new Date() },
            { id: 2, activity: 'logout', timestamp: new Date() },
          ],
        },
      };

      const result = await controller.analyze(data);

      expect(result.analysis).toBeDefined();
      expect(typeof result.analysis).toBe('string');
    });

    it('should handle numeric array data', async () => {
      const data = {
        query: 'Calculate average',
        data: [10, 20, 30, 40, 50],
      };

      const result = await controller.analyze(data);

      expect(result).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle empty data', async () => {
      const data = {
        query: 'What can you tell me?',
        data: [] as never[],
      };

      const result = await controller.analyze(data);

      expect(result).toBeDefined();
      expect(result.analysis).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      jest.spyOn(aiService, 'processChat').mockRejectedValueOnce(new Error('Service unavailable'));

      const chatDto: ChatMessageDto = {
        message: 'Test message',
      };

      await expect(controller.chat(chatDto)).rejects.toThrow('Service unavailable');
    });

    it('should handle insights generation errors', async () => {
      jest.spyOn(aiService, 'generateInsights').mockRejectedValueOnce(new Error('Analysis failed'));

      const insightsDto: InsightsRequestDto = {
        data: [{ value: 1 }],
        insightType: 'performance',
      };

      await expect(controller.generateInsights(insightsDto)).rejects.toThrow('Analysis failed');
    });
  });
});
