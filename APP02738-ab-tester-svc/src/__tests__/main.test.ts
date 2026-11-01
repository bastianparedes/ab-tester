import { beforeEach, describe, expect, it, vi } from 'vitest';

const { app, create } = vi.hoisted(() => {
  const app = {
    enableCors: vi.fn(),
    listen: vi.fn(),
    use: vi.fn(),
    useGlobalPipes: vi.fn(),
  };
  const create = vi.fn().mockResolvedValue(app);
  return { app, create };
});

vi.mock('@nestjs/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nestjs/core')>();
  return { ...original, NestFactory: { create } };
});

import { NestFactory } from '@nestjs/core';

describe('application bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue(app);
    app.listen.mockImplementation(() => Promise.resolve());
  });

  it('configures Nest middleware, CORS, and the HTTP listener', async () => {
    await import('../main.js');
    await vi.waitFor(() => expect(app.listen).toHaveBeenCalledOnce());

    expect(NestFactory.create).toHaveBeenCalledOnce();
    expect(app.useGlobalPipes).toHaveBeenCalledOnce();
    expect(app.use).toHaveBeenCalledOnce();
    expect(app.enableCors).toHaveBeenCalledWith({ credentials: true, origin: true });
    expect(app.listen).toHaveBeenCalledOnce();
  }, 15_000);
});
