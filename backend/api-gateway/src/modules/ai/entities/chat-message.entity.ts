import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MessageRole } from '../ai.model';
import { User } from '../../user/user.entity';

@ObjectType()
@Entity('chat_messages')
export class ChatMessage {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  conversationId?: string;

  @Field(() => MessageRole)
  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role: MessageRole;

  @Field()
  @Column('text')
  content: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Field()
  @CreateDateColumn()
  timestamp: Date;
}
