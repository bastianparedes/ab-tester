import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('JWT helpers', () => {
  let jwtHelpers: typeof import('../jwt');

  beforeAll(async () => {
    vi.stubEnv('DATABASE_URL_POSTGRES', 'postgres://test:test@localhost/test');
    vi.stubEnv('DATABASE_URL_REDIS', 'redis://localhost:6379');
    vi.stubEnv('JWT_SECRET', 'unit-test-secret');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SALT_ROUNDS', '10');
    vi.stubEnv('SERVICE_BASE_URL', 'http://localhost:4000');
    vi.resetModules();
    jwtHelpers = await import('../jwt.js');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each(['access', 'refresh_token'] as const)('generates valid %s tokens', (purpose) => {
    const token = jwtHelpers.generateToken({ id: 23, purpose });

    expect(jwtHelpers.getTokenData({ purpose, token })).toMatchObject({ id: 23, valid: true });
  });

  it('rejects a token used for the wrong purpose', () => {
    const token = jwtHelpers.generateToken({ id: 23, purpose: 'access' });

    expect(jwtHelpers.getTokenData({ purpose: 'refresh_token', token })).toEqual({ id: null, valid: false });
  });

  it('rejects malformed tokens', () => {
    expect(jwtHelpers.getTokenData({ purpose: 'access', token: 'not-a-jwt' })).toEqual({ id: null, valid: false });
  });
});
