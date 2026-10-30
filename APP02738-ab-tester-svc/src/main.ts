import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { env } from './libs/env';
import { setupSwagger } from './swagger/setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.use(cookieParser());

  setupSwagger(app);

  app.enableCors({
    credentials: true,
    origin: true,
  });
  await app.listen(env.PORT);
}
bootstrap();
