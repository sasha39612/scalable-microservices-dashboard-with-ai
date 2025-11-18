import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AIModule } from './modules/ai/ai.module';
import { HealthController } from './health.controller';
import { WorkerClient } from './services/worker.client';
import { AIClient } from './services/ai.client';
import { User } from './modules/user/user.entity';
import { Task } from './modules/tasks/entities/task.entity';
import { Job } from './modules/tasks/entities/job.entity';
import { ChatMessage } from './modules/ai/entities/chat-message.entity';
import { DashboardInsight } from './modules/dashboard/entities/dashboard-insight.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Task, Job, ChatMessage, DashboardInsight],
      synchronize: true, // Set to false in production
      logging: process.env.NODE_ENV === 'development',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      sortSchema: true,
    }),
    AuthModule,
    UserModule,
    DashboardModule,
    TasksModule,
    AIModule,
  ],
  controllers: [HealthController],
  providers: [WorkerClient, AIClient],
})
export class AppModule {}
