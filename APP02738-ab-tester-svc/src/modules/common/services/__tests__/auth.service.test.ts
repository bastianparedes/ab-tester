import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('AuthService', () => {
  let AuthService: typeof import('../auth.service').AuthService;
  let generateToken: typeof import('../../../../libs/auth/jwt').generateToken;

  beforeAll(async () => {
    vi.stubEnv('DATABASE_URL_POSTGRES', 'postgres://test:test@localhost/test');
    vi.stubEnv('DATABASE_URL_REDIS', 'redis://localhost:6379');
    vi.stubEnv('JWT_SECRET', 'unit-test-secret');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SALT_ROUNDS', '10');
    vi.stubEnv('SERVICE_BASE_URL', 'http://localhost:4000');
    vi.resetModules();
    ({ AuthService } = await import('../auth.service.js'));
    ({ generateToken } = await import('../../../../libs/auth/jwt.js'));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns null when the access token cookie is missing', async () => {
    const service = new AuthService({ users: { get: async () => null } } as never);

    await expect(service.getUserFromToken({})).resolves.toBeNull();
  });

  it('returns null when the access token is invalid', async () => {
    const service = new AuthService({ users: { get: async () => null } } as never);

    await expect(service.getUserFromToken({ accessToken: 'invalid' })).resolves.toBeNull();
  });

  it('loads and returns the user identified by a valid access token', async () => {
    const user = { id: 23, name: 'Test user' };
    const requestedIds: number[] = [];
    const service = new AuthService({
      users: {
        get: async ({ userId }: { userId: number }) => {
          requestedIds.push(userId);
          return user;
        },
      },
    } as never);
    const token = generateToken({ id: user.id, purpose: 'access' });

    await expect(service.getUserFromToken({ accessToken: token })).resolves.toBe(user);
    expect(requestedIds).toEqual([user.id]);
  });
});
