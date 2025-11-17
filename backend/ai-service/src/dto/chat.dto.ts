import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsArray()
  @IsOptional()
  context?: string[];
}

export class ChatResponseDto {
  conversationId: string;
  response: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    confidence?: number;
    cached?: boolean;
  };
}

export class InsightsRequestDto {
  @IsArray()
  @IsNotEmpty()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];

  @IsString()
  @IsNotEmpty()
  insightType: 'performance' | 'usage' | 'trends' | 'anomalies' | 'predictions';

  @IsOptional()
  timeRange?: {
    start: Date;
    end: Date;
  };

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  async?: boolean;
}

export class InsightsResponseDto {
  insights: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    confidence: number;
  };
  visualizations?: {
    type: string;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
  }[];
  timestamp: Date;
  metadata?: {
    jobId?: string;
    status?: string;
    async?: boolean;
  };
}
