import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AIModule } from './modules/ai/ai.module';
import { SecurityModule } from './security/security.module';
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
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Task, Job, ChatMessage, DashboardInsight],
      synchronize: process.env.NODE_ENV !== 'production', // Only sync in development
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    
    // Rate limiting configuration with Redis support for production
    ThrottlerModule.forRoot(rateLimitConfig),
    
    // GraphQL configuration with security enhancements
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: process.env.NODE_ENV === 'development',
      introspection: process.env.NODE_ENV === 'development',
      sortSchema: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
      
      // Format errors to prevent information disclosure
      formatError: (error) => {
        if (process.env.NODE_ENV === 'production') {
          // Don't expose internal error details in production
          return {
            message: error.message,
            code: error.extensions?.code,
            timestamp: new Date().toISOString(),
          };
        }
        return error;
      },
    }),
    
    // Application modules
    SecurityModule, // Include security module first for early middleware application
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
    // Apply audit logging globally
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // Apply GraphQL-specific rate limiting
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
