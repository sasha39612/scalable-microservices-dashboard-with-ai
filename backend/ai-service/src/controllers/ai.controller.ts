import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AIService } from '../services/ai.service';
import { ChatMessageDto, ChatResponseDto, InsightsRequestDto, InsightsResponseDto } from '../dto/chat.dto';

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(private readonly aiService: AIService) {}

  /**
   * POST /ai/chat
   * Send a message to the AI assistant and receive a response
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() chatDto: ChatMessageDto): Promise<ChatResponseDto> {
    this.logger.log('Received chat request');
    return await this.aiService.processChat(chatDto);
  }

  /**
   * POST /ai/insights
   * Generate AI-powered insights from provided data
   */
  @Post('insights')
  @HttpCode(HttpStatus.OK)
  async generateInsights(@Body() insightsDto: InsightsRequestDto): Promise<InsightsResponseDto> {
    this.logger.log(`Received insights request for type: ${insightsDto.insightType}`);
    return await this.aiService.generateInsights(insightsDto);
  }

  /**
   * GET /ai/conversation/:conversationId
   * Retrieve conversation history by ID
   */
  @Get('conversation/:conversationId')
  async getConversationHistory(@Param('conversationId') conversationId: string): Promise<Array<{ role: string; content: string }>> {
    this.logger.log(`Retrieving conversation history: ${conversationId}`);
    return await this.aiService.getConversationHistory(conversationId);
  }

  /**
   * DELETE /ai/conversation/:conversationId
   * Clear conversation history by ID
   */
  @Delete('conversation/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearConversation(@Param('conversationId') conversationId: string): Promise<void> {
    this.logger.log(`Clearing conversation: ${conversationId}`);
    await this.aiService.clearConversation(conversationId);
  }

  /**
   * POST /ai/chat/batch
   * Process multiple chat messages in a batch
   */
  @Post('chat/batch')
  @HttpCode(HttpStatus.OK)
  async batchChat(@Body() messages: ChatMessageDto[]): Promise<ChatResponseDto[]> {
    this.logger.log(`Received batch chat request with ${messages.length} messages`);
    const responses: ChatResponseDto[] = [];
    
    for (const message of messages) {
      const response = await this.aiService.processChat(message);
      responses.push(response);
    }
    
    return responses;
  }

  /**
   * POST /ai/analyze
   * Quick analysis endpoint for simple data analysis requests
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async analyze(@Body() data: { query: string; data: any }): Promise<{ analysis: string; timestamp: Date }> {
    this.logger.log('Received analysis request');
    
    // Use chat service for quick analysis
    const chatResponse = await this.aiService.processChat({
      message: `Analyze this data: ${JSON.stringify(data.data)}. Query: ${data.query}`,
    });
    
    return {
      analysis: chatResponse.response,
      timestamp: new Date(),
    };
  }
}
