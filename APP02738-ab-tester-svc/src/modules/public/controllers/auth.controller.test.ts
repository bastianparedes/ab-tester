import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { generateToken, getTokenData } from '../../../libs/auth/jwt';
import { getPasswordHashed } from '../../../libs/auth/password';
import { cookieNames } from '../../../libs/constants';
import { AuthController } from './auth.controller';

const createResponse = () => {
  const cookies: unknown[][] = [];
  const clearedCookies: unknown[][] = [];
  return {
    clearedCookies,
    cookies,
    response: {
      clearCookie: (...args: unknown[]) => clearedCookies.push(args),
      cookie: (...args: unknown[]) => cookies.push(args),
    },
  };
};

describe('AuthController', () => {
  it('clears access and refresh cookies when logging out', async () => {
    const { clearedCookies, response } = createResponse();
    const controller = new AuthController({} as never, {} as never);

    await expect(controller.logOut(response as never)).resolves.toEqual({});
    expect(clearedCookies.map(([name]) => name)).toEqual([cookieNames.accessToken, cookieNames.refreshToken]);
  });

  it('rejects login when the account is unknown or the password is wrong', async () => {
    const { response } = createResponse();
    const missingUser = new AuthController({ users: { getForLogin: async () => null } } as never, {} as never);
    const passwordHash = getPasswordHashed('correct password');
    const wrongPassword = new AuthController({ users: { getForLogin: async () => ({ id: 17, passwordHash }) } } as never, {} as never);

    await expect(missingUser.logIn(response as never, { email: 'missing@example.test', password: 'secret' } as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(wrongPassword.logIn(response as never, { email: 'user@example.test', password: 'wrong' } as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues both session cookies and stores the refresh token on login', async () => {
    const { cookies, response } = createResponse();
    const passwordHash = getPasswordHashed('correct password');
    const savedRefreshTokens: unknown[] = [];
    const controller = new AuthController(
      { users: { getForLogin: async () => ({ id: 17, passwordHash }) } } as never,
      { refreshToken: { save: async (input: unknown) => savedRefreshTokens.push(input) } } as never,
    );

    await expect(controller.logIn(response as never, { email: 'user@example.test', password: 'correct password' } as never)).resolves.toEqual({});
    expect(cookies.map(([name]) => name)).toEqual([cookieNames.refreshToken, cookieNames.accessToken]);
    expect(savedRefreshTokens).toHaveLength(1);
    expect(savedRefreshTokens[0]).toMatchObject({ userId: 17 });
    expect(getTokenData({ purpose: 'refresh_token', token: cookies[0][1] as string })).toMatchObject({ id: 17, valid: true });
    expect(getTokenData({ purpose: 'access', token: cookies[1][1] as string })).toMatchObject({ id: 17, valid: true });
  });

  it('returns without changing cookies when no refresh token is supplied', async () => {
    const { clearedCookies, cookies, response } = createResponse();
    const controller = new AuthController({} as never, {} as never);

    await expect(controller.refreshToken({ cookies: {} } as never, response as never)).resolves.toEqual({});
    expect(cookies).toEqual([]);
    expect(clearedCookies).toEqual([]);
  });

  it('ignores invalid refresh tokens', async () => {
    const { clearedCookies, cookies, response } = createResponse();
    const controller = new AuthController({} as never, {} as never);

    await expect(controller.refreshToken({ cookies: { [cookieNames.refreshToken]: 'invalid' } } as never, response as never)).resolves.toEqual({});
    expect(cookies).toEqual([]);
    expect(clearedCookies).toEqual([]);
  });

  it('rotates tokens when the refresh token matches the cache', async () => {
    const { cookies, response } = createResponse();
    const oldRefreshToken = generateToken({ id: 17, purpose: 'refresh_token' });
    const savedRefreshTokens: unknown[] = [];
    const controller = new AuthController(
      {} as never,
      {
        refreshToken: {
          get: async () => oldRefreshToken,
          save: async (input: unknown) => savedRefreshTokens.push(input),
        },
      } as never,
    );

    await expect(controller.refreshToken({ cookies: { [cookieNames.refreshToken]: oldRefreshToken } } as never, response as never)).resolves.toEqual({});
    expect(savedRefreshTokens).toHaveLength(1);
    expect(cookies.map(([name]) => name)).toEqual([cookieNames.refreshToken, cookieNames.accessToken]);
    expect(getTokenData({ purpose: 'refresh_token', token: cookies[0][1] as string })).toMatchObject({ id: 17, valid: true });
    expect(getTokenData({ purpose: 'access', token: cookies[1][1] as string })).toMatchObject({ id: 17, valid: true });
  });

  it('clears cached refresh state and session cookies when a token is replayed', async () => {
    const { clearedCookies, response } = createResponse();
    const oldRefreshToken = generateToken({ id: 17, purpose: 'refresh_token' });
    const clearedIds: number[] = [];
    const controller = new AuthController(
      {} as never,
      {
        refreshToken: {
          clear: async ({ userId }: { userId: number }) => clearedIds.push(userId),
          get: async () => 'a different refresh token',
        },
      } as never,
    );

    await expect(controller.refreshToken({ cookies: { [cookieNames.refreshToken]: oldRefreshToken } } as never, response as never)).resolves.toEqual({});
    expect(clearedIds).toEqual([17]);
    expect(clearedCookies.map(([name]) => name)).toEqual([cookieNames.accessToken, cookieNames.refreshToken]);
  });
});
