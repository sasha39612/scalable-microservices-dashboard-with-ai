import { ObjectType, Field, ID, HideField, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from 'common';

// Register UserRole enum for GraphQL
registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role for authorization',
});

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  name: string;

  @HideField()
  @Column({ name: 'passwordHash' })
  password: string;

  @HideField()
  @Column({ name: 'refreshToken', nullable: true })
  refreshToken?: string;

  @Field(() => UserRole)
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.User,
  })
  role: UserRole;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
