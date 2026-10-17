import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { RedisIoAdapter } from './adapters/redis-socket-io';
import { AppModule } from './app.module';
import { env } from './libs/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.use(cookieParser());

  // --- Swagger ---
  const config = new DocumentBuilder()
    .setTitle('AB Tester API')
    .setDescription('Documentación de endpoints del servicio AB Tester')
    .setVersion('1.0')
    .addBearerAuth({ bearerFormat: 'JWT', scheme: 'bearer', type: 'http' }, 'access-token')
    .addCookieAuth('access-token', { in: 'cookie', type: 'apiKey' }, 'cookie')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  // --- Fin Swagger ---

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
