import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { RedisIoAdapter } from './adapters/redis-socket-io';
import { AppModule } from './app.module';
import { env } from './libs/env';
import { setupSwagger } from './swagger/setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.use(cookieParser());

  setupSwagger(app);

  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);

  app.enableCors({
    credentials: true,
    origin: true,
  });
  await app.listen(env.PORT);
}
bootstrap();
