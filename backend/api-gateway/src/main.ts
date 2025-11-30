import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Trust proxy for proper IP detection behind load balancers
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  // Configure CORS with security considerations
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const allowedOrigins = typeof corsOrigin === 'string' 
    ? corsOrigin.split(',').map(origin => origin.trim())
    : corsOrigin;
    
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'apollo-require-preflight',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // Cache preflight response for 24 hours
  });

  // Security configuration
  if (process.env.NODE_ENV === 'production') {
    // Disable detailed error messages in production
    app.getHttpAdapter().getInstance().set('env', 'production');
  }

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 GraphQL server running on http://localhost:${port}/graphql`);
  logger.log(`🛡️  Security features enabled: WAF, DDoS Protection, Rate Limiting`);
  logger.log(`📊 Security monitoring available at: http://localhost:${port}/security/health`);
}

bootstrap().catch(err => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start server:', err);
  process.exit(1);
});
