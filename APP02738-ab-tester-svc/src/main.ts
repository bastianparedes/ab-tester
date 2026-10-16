import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { RedisIoAdapter } from './adapters/redis-socket-io';
import { AppModule } from './app.module';
import { env } from './libs/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

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
