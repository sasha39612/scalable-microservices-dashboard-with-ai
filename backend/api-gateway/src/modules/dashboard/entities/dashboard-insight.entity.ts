import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('dashboard_insights')
export class DashboardInsight {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  type: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column('text')
  description: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column('jsonb', { nullable: true })
  data?: Record<string, unknown>;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  confidence?: number;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  recommendations?: string[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
