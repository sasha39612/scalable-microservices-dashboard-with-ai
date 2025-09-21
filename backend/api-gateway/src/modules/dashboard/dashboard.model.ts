// src/dashboard/dashboard.model.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

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
