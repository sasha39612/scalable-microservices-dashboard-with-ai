// src/dashboard/dashboard.model.ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class DashboardStat {
  @Field()
  title: string;

  @Field(() => Int)
  value: number;

  @Field(() => String, { nullable: true })
  trend?: 'up' | 'down';

  @Field(() => String, { nullable: true })
  trendValue?: string; // e.g., '15%'
}

@ObjectType()
export class DashboardInsight {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => GraphQLJSON, { nullable: true })
  data?: Record<string, unknown>;

  @Field(() => Float, { nullable: true })
  confidence?: number;

  @Field(() => [String], { nullable: true })
  recommendations?: string[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class TrendDataPoint {
  @Field(() => Int)
  day: number;

  @Field(() => Int, { nullable: true })
  completed?: number;

  @Field(() => Int, { nullable: true })
  failed?: number;

  @Field(() => Int, { nullable: true })
  users?: number;
}

@ObjectType()
export class HistoricalTrends {
  @Field()
  period: string;

  @Field(() => [TrendDataPoint])
  taskCompletionTrend: TrendDataPoint[];

  @Field(() => [TrendDataPoint])
  userGrowthTrend: TrendDataPoint[];
}
