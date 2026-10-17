import { afterEach, describe, expect, it, vi } from 'vitest';

const { adapter, client, server } = vi.hoisted(() => {
  const adapter = vi.fn();
  const server = { adapter: vi.fn() };
  const subClient = { connect: vi.fn().mockResolvedValue(undefined) };
  const client = {
    connect: vi.fn().mockResolvedValue(undefined),
    duplicate: vi.fn(() => subClient),
  };
  return { adapter, client, server };
});

vi.mock('redis', () => ({ createClient: vi.fn(() => client) }));
vi.mock('@socket.io/redis-adapter', () => ({ createAdapter: vi.fn(() => adapter) }));
vi.mock('@nestjs/platform-socket.io', () => ({
  IoAdapter: class {
    createIOServer() {
      return server;
    }
  },
}));

import { RedisIoAdapter } from '../redis-socket-io';

describe('RedisIoAdapter', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('connects Redis publisher and subscriber clients and installs their adapter', async () => {
    const adapterInstance = new RedisIoAdapter({} as never);

    await adapterInstance.connectToRedis();

    expect(client.connect).toHaveBeenCalledOnce();
    expect(client.duplicate).toHaveBeenCalledOnce();
    const createdServer = adapterInstance.createIOServer(4000, { cors: { origin: '*' } } as Parameters<typeof adapterInstance.createIOServer>[1]);

    expect(createdServer).toBe(server);
    expect(server.adapter).toHaveBeenCalledWith(adapter);
  });
});
