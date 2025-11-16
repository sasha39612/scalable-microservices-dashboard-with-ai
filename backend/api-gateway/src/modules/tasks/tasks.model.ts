import { ObjectType, Field, ID, registerEnumType, InputType, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

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
  type: string;

  @Field(() => GraphQLJSON)
  payload: Record<string, unknown>;

  @Field(() => TaskPriority, { nullable: true })
  priority?: TaskPriority;
}

@InputType()
export class CreateJobInput {
  @Field()
  name: string;

  @Field()
  type: string;

  @Field()
  schedule: string;

  @Field(() => GraphQLJSON)
  payload: Record<string, unknown>;
}

@InputType()
export class TaskFiltersInput {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  type?: string;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}
