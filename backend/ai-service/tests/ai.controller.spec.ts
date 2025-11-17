import { Test, TestingModule } from '@nestjs/testing';
import { AIController } from '../src/controllers/ai.controller';
import { AIService } from '../src/services/ai.service';
import { ChatMessageDto, InsightsRequestDto } from '../src/dto/chat.dto';

describe('AIController', () => {
  let controller: AIController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [AIService],
    }).compile();

    controller = module.get<AIController>(AIController);
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
  });
});
