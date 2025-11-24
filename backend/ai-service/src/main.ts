import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AIModule } from './ai-module';

async function bootstrap() {
  const app = await NestFactory.create(AIModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 5000;
  await app.listen(port);
  
  // eslint-disable-next-line no-console
  console.log(`AI Service started on port ${port}`);
  // eslint-disable-next-line no-console
  console.log(`AI_SERVICE_API_KEY is ${process.env.AI_SERVICE_API_KEY ? 'SET' : 'NOT SET'}`);
  // eslint-disable-next-line no-console
  console.log(`OPENAI_API_KEY is ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
}

bootstrap();

