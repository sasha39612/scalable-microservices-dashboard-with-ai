import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // Nest auto-uses Express 4
  app.enableCors({
    origin: 'http://localhost:3000', // allow frontend
    credentials: true,
  });
  await app.listen(4000);
  console.log('GraphQL server running on http://localhost:4000/graphql');
}
bootstrap();
