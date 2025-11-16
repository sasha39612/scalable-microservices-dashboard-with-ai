import { ObjectType, Field, ID, registerEnumType, InputType, Int, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

// Enums
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum InsightType {
  ANALYTICS = 'analytics',
  RECOMMENDATIONS = 'recommendations',
  PREDICTIONS = 'predictions',
  SUMMARY = 'summary',
}

export enum DataType {
  METRICS = 'metrics',
  LOGS = 'logs',
  EVENTS = 'events',
  USER_BEHAVIOR = 'user-behavior',
}

export enum AnalysisType {
  TREND = 'trend',
  ANOMALY = 'anomaly',
  CORRELATION = 'correlation',
  CLASSIFICATION = 'classification',
}

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

registerEnumType(MessageRole, {
  name: 'MessageRole',
});

registerEnumType(InsightType, {
  name: 'InsightType',
});

registerEnumType(DataType, {
  name: 'DataType',
});

registerEnumType(AnalysisType, {
  name: 'AnalysisType',
});

registerEnumType(RecommendationPriority, {
  name: 'RecommendationPriority',
});

// Object Types
@ObjectType()
export class ChatMessage {
  @Field(() => MessageRole)
  role: MessageRole;

  @Field()
  content: string;

  @Field({ nullable: true })
  timestamp?: Date;
}

@ObjectType()
export class ChatResponse {
  @Field()
  message: string;

  @Field(() => MessageRole)
  role: MessageRole;

  @Field({ nullable: true })
  conversationId?: string;

  @Field(() => Int, { nullable: true })
  tokensUsed?: number;

  @Field({ nullable: true })
  model?: string;

  @Field()
  timestamp: Date;
}

@ObjectType()
export class Insight {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => GraphQLJSON)
  data: Record<string, unknown>;

  @Field(() => Float, { nullable: true })
  confidence?: number;

  @Field(() => [String], { nullable: true })
  recommendations?: string[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AnalysisResponse {
  @Field(() => GraphQLJSON)
  results: Record<string, unknown>;

  @Field(() => [String])
  insights: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  visualizations?: unknown[];

  @Field(() => Float)
  confidence: number;

  @Field()
  processedAt: Date;
}

@ObjectType()
export class Recommendation {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => RecommendationPriority)
  priority: RecommendationPriority;

  @Field(() => Float)
  confidence: number;
}

@ObjectType()
export class RecommendationsResponse {
  @Field(() => [Recommendation])
  recommendations: Recommendation[];
}

@ObjectType()
export class SummaryResponse {
  @Field()
  summary: string;

  @Field(() => [String])
  keyPoints: string[];

  @Field(() => Int)
  wordCount: number;

  @Field(() => Float, { nullable: true })
  confidence?: number;
}

// Input Types
@InputType()
export class ChatMessageInput {
  @Field(() => MessageRole)
  role: MessageRole;

  @Field()
  content: string;

  @Field({ nullable: true })
  timestamp?: Date;
}

@InputType()
export class ChatOptionsInput {
  @Field(() => Float, { nullable: true })
  temperature?: number;

  @Field(() => Int, { nullable: true })
  maxTokens?: number;

  @Field({ nullable: true })
  model?: string;
}

@InputType()
export class ChatRequestInput {
  @Field(() => [ChatMessageInput])
  messages: ChatMessageInput[];

  @Field({ nullable: true })
  userId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  context?: Record<string, unknown>;

  @Field(() => ChatOptionsInput, { nullable: true })
  options?: ChatOptionsInput;
}

@InputType()
export class InsightRequestInput {
  @Field(() => InsightType)
  type: InsightType;

  @Field(() => GraphQLJSON)
  data: Record<string, unknown>;

  @Field({ nullable: true })
  userId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  context?: Record<string, unknown>;
}

@InputType()
export class TimeRangeInput {
  @Field()
  start: Date;

  @Field()
  end: Date;
}

@InputType()
export class AnalysisRequestInput {
  @Field(() => DataType)
  dataType: DataType;

  @Field(() => GraphQLJSON)
  data: unknown[];

  @Field(() => AnalysisType, { nullable: true })
  analysisType?: AnalysisType;

  @Field(() => TimeRangeInput, { nullable: true })
  timeRange?: TimeRangeInput;
}

@InputType()
export class RecommendationsRequestInput {
  @Field()
  userId: string;

  @Field(() => GraphQLJSON)
  context: Record<string, unknown>;

  @Field(() => Int, { nullable: true })
  count?: number;
}

@InputType()
export class SummaryRequestInput {
  @Field()
  text: string;

  @Field(() => Int, { nullable: true })
  maxLength?: number;

  @Field({ nullable: true })
  style?: string;
}
