import { beforeEach, describe, expect, it, vi } from 'vitest';

const { app, create, document, redisAdapter } = vi.hoisted(() => {
  const app = {
    enableCors: vi.fn(),
    listen: vi.fn(),
    use: vi.fn(),
    useGlobalPipes: vi.fn(),
    useWebSocketAdapter: vi.fn(),
  };
  const create = vi.fn().mockResolvedValue(app);
  const document = { openapi: '3.0.0' };
  const redisAdapter = {
    connectToRedis: vi.fn().mockResolvedValue(undefined),
  };
  return { app, create, document, redisAdapter };
});

vi.mock('@nestjs/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nestjs/core')>();
  return { ...original, NestFactory: { create } };
});
vi.mock('@nestjs/swagger', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nestjs/swagger')>();
  return {
    ...original,
    DocumentBuilder: class {
      addTag() {
        return this;
      }
      addCookieAuth() {
        return this;
      }
      setDescription() {
        return this;
      }
      setTitle() {
        return this;
      }
      setVersion() {
        return this;
      }
      build() {
        return document;
      }
    },
    SwaggerModule: {
      createDocument: vi.fn(() => document),
      setup: vi.fn(),
    },
  };
});
vi.mock('../adapters/redis-socket-io', () => ({
  RedisIoAdapter: class {
    connectToRedis = redisAdapter.connectToRedis;
  },
}));

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

describe('application bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue(app);
    app.listen.mockImplementation(() => Promise.resolve());
    redisAdapter.connectToRedis.mockResolvedValue(undefined);
  });

  it('configures Nest middleware, Swagger, Redis sockets, CORS, and the HTTP listener', async () => {
    await import('../main.js');
    await vi.waitFor(() => expect(app.listen).toHaveBeenCalledOnce());

    expect(NestFactory.create).toHaveBeenCalledOnce();
    expect(app.useGlobalPipes).toHaveBeenCalledOnce();
    expect(app.use).toHaveBeenCalledOnce();
    expect(SwaggerModule.createDocument).toHaveBeenCalledOnce();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('docs', app, document, {
      customSiteTitle: 'AB Tester API | Swagger',
      swaggerOptions: {
        deepLinking: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        operationsSorter: 'alpha',
        persistAuthorization: false,
        tagsSorter: 'alpha',
      },
    });
    expect(redisAdapter.connectToRedis).toHaveBeenCalledOnce();
    expect(app.useWebSocketAdapter).toHaveBeenCalledOnce();
    expect(app.enableCors).toHaveBeenCalledWith({ credentials: true, origin: true });
    expect(app.listen).toHaveBeenCalledOnce();
  }, 15_000);
});
