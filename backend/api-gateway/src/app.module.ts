import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { GqlThrottlerGuard } from './guards/gql-throttler.guard';
import { rateLimitConfig } from './config/rate-limit.config';
import { AuditLoggerInitializer } from './services/audit-logger-initializer';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Task, Job, ChatMessage, DashboardInsight],
      synchronize: true, // Set to false in production
      logging: process.env.NODE_ENV === 'development',
    }),
    // Rate limiting configuration
    ThrottlerModule.forRoot(rateLimitConfig),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      sortSchema: true,
      context: ({ req, res }: { req: any; res: any }) => ({ req, res }),
    }),
    AuthModule,
    UserModule,
    DashboardModule,
    TasksModule,
    AIModule,
  ],
  controllers: [HealthController],
  providers: [
    WorkerClient,
    AIClient,
    AuditLoggerInitializer,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
