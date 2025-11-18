import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { JobStatus } from '../tasks.model';

@ObjectType()
@Entity('jobs')
export class Job {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  schedule?: string;

  @Field(() => JobStatus)
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.ACTIVE,
  })
  status: JobStatus;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastRun?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  nextRun?: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
