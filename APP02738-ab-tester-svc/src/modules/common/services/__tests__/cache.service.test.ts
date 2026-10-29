import type { TypeUser } from '@ab-tester/constants/types/user';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { client } = vi.hoisted(() => ({
  client: {
    connect: vi.fn(),
    del: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('redis', () => ({ createClient: vi.fn(() => client) }));

import { secondsRefreshTokenIsValid } from '../../../../libs/auth/jwt';
import { env } from '../../../../libs/env';
import { CacheService } from '../cache.service';

describe('CacheService', () => {
  const originalNodeEnv = env.NODE_ENV;

  beforeEach(() => {
    env.NODE_ENV = 'test';
    client.connect.mockReset();
    client.del.mockReset();
    client.get.mockReset();
    client.set.mockReset();
  });

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv;
  });

  it('gets and deletes cached public scripts', async () => {
    const cache = new CacheService();
    client.get.mockResolvedValue('script');

    await expect(cache.scripts.get({ tenantId: 3 })).resolves.toBe('script');
    await cache.scripts.del({ tenantId: 3 });

    expect(client.get).toHaveBeenCalledWith('tenant:3:public_script');
    expect(client.del).toHaveBeenCalledWith('tenant:3:public_script');
  });

  it('saves public scripts only in production', async () => {
    const cache = new CacheService();

    await cache.scripts.save({ code: 'script', tenantId: 3 });
    expect(client.set).not.toHaveBeenCalled();

    env.NODE_ENV = 'production';
    await cache.scripts.save({ code: 'script', tenantId: 3 });

    expect(client.set).toHaveBeenCalledWith('tenant:3:public_script', 'script', { EX: 60 });
  });

  it('returns no cached user for a missing value and clears selected users', async () => {
    const cache = new CacheService();
    client.get.mockResolvedValue(null);

    await expect(cache.users.get({ userId: 7 })).resolves.toBeNull();
    await cache.users.clear({ userIds: [] });
    expect(client.del).not.toHaveBeenCalled();

    await cache.users.clear({ userIds: [7, 8] });

    expect(client.del).toHaveBeenCalledWith(['user:7', 'user:8']);
  });

  it('parses and saves cached users', async () => {
    const cache = new CacheService();
    const user: TypeUser = { email: 'ada@example.test', id: 7, name: 'Ada', roles: [] };
    client.get.mockResolvedValue(JSON.stringify(user));

    await expect(cache.users.get({ userId: user.id })).resolves.toEqual(user);
    await cache.users.save({ user });
    expect(client.set).not.toHaveBeenCalled();

    env.NODE_ENV = 'production';
    await cache.users.save({ user });

    expect(client.set).toHaveBeenCalledWith('user:7', JSON.stringify(user), { EX: 300 });
  });

  it('gets, clears, and saves refresh tokens', async () => {
    const cache = new CacheService();
    client.get.mockResolvedValue(JSON.stringify('refresh-token'));

    await expect(cache.refreshToken.get({ userId: 7 })).resolves.toBe('refresh-token');
    await cache.refreshToken.clear({ userId: 7 });
    await cache.refreshToken.save({ refreshToken: 'refresh-token', userId: 7 });

    expect(client.del).toHaveBeenCalledWith('refresh_token:user:7');
    expect(client.set).toHaveBeenCalledWith('refresh_token:user:7', JSON.stringify('refresh-token'), { EX: secondsRefreshTokenIsValid });

    client.get.mockResolvedValue(null);
    await expect(cache.refreshToken.get({ userId: 7 })).resolves.toBeNull();
  });
});
