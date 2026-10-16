import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { generateToken } from '../libs/auth/jwt';
import { AuthGuard } from './auth.guard';

const accessToken = generateToken({ id: 17, purpose: 'access' });

const createGuard = (user: unknown) => {
  let lookupCount = 0;
  const guard = new (AuthGuard({ action: 'read', feature: 'campaign' }) as new (db: never) => { canActivate: (context: ExecutionContext) => Promise<boolean> })({
    users: {
      get: async () => {
        lookupCount++;
        return user;
      },
    },
  } as never);

  return { getLookupCount: () => lookupCount, guard };
};

const createContext = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  it('rejects requests without an access token', async () => {
    const { guard, getLookupCount } = createGuard({ roles: [] });

    await expect(guard.canActivate(createContext({ cookies: {}, params: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(getLookupCount()).toBe(0);
  });

  it('rejects invalid tokens before loading a user', async () => {
    const { guard, getLookupCount } = createGuard({ roles: [] });

    await expect(guard.canActivate(createContext({ cookies: { accessToken: 'invalid' }, params: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(getLookupCount()).toBe(0);
  });

  it('rejects valid tokens whose user no longer exists', async () => {
    const { guard } = createGuard(null);

    await expect(guard.canActivate(createContext({ cookies: { accessToken }, params: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects users without the required permission', async () => {
    const { guard } = createGuard({ roles: [{ permissions: ['feature.campaign.action.update'] }] });

    await expect(guard.canActivate(createContext({ cookies: { accessToken }, params: {} }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows tenant-scoped permissions and attaches the authenticated user', async () => {
    const user = { id: 17, roles: [{ permissions: ['tenant.42.feature.campaign.action.read'] }] };
    const { guard } = createGuard(user);
    const request = { cookies: { accessToken }, params: { tenantId: '42' } };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toHaveProperty('user', user);
  });

  it('allows global feature permissions when no tenant is requested', async () => {
    const { guard } = createGuard({ roles: [{ permissions: ['feature.campaign.action.read'] }] });

    await expect(guard.canActivate(createContext({ cookies: { accessToken }, params: {} }))).resolves.toBe(true);
  });
});
