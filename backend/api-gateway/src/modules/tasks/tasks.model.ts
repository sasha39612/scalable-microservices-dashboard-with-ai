import { ObjectType, Field, ID, registerEnumType, InputType, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

// Enums
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum JobStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  FAILED = 'failed',
}

registerEnumType(TaskStatus, {
  name: 'TaskStatus',
});

registerEnumType(TaskPriority, {
  name: 'TaskPriority',
});

registerEnumType(JobStatus, {
  name: 'JobStatus',
});

// Object Types
@ObjectType()
export class Task {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field(() => TaskStatus)
  status: TaskStatus;

  @Field(() => GraphQLJSON)
  payload: Record<string, unknown>;

  @Field(() => GraphQLJSON, { nullable: true })
  result?: unknown;

  @Field({ nullable: true })
  error?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Job {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  schedule?: string;

  @Field(() => JobStatus)
  status: JobStatus;

  @Field({ nullable: true })
  lastRun?: Date;

  @Field({ nullable: true })
  nextRun?: Date;
}

@ObjectType()
export class TasksResponse {
  @Field(() => [Task])
  tasks: Task[];

  @Field(() => Int)
  total: number;
}

// Input Types
@InputType()
export class CreateTaskInput {
  @Field()
  @IsString()
  type: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  payload: Record<string, unknown>;

  @Field(() => TaskPriority, { nullable: true })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}

@InputType()
export class CreateJobInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  type: string;

  @Field()
  @IsString()
  schedule: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  payload: Record<string, unknown>;
}

@InputType()
export class TaskFiltersInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  type?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  offset?: number;
}
