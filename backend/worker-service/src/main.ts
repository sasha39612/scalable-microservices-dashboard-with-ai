import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WorkerModule } from './worler.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule);
  
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 4001;
  await app.listen(port);
  
  // eslint-disable-next-line no-console
  console.log(`Worker Service started on port ${port}`);
}

bootstrap();

