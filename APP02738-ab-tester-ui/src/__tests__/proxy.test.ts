import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sharedConstants from '@/config/sharedConstants';
import { apiCaller } from '@/libs/restClient';
import { proxy } from '../proxy';

afterEach(() => vi.restoreAllMocks());

const requestWithCookies = (cookie: string) => new NextRequest('https://app.example.test/tenants', { headers: { cookie } });

describe('auth proxy', () => {
  it('does not refresh when an access token is already present', async () => {
    const refresh = vi.spyOn(apiCaller.sessions, 'refreshAccessToken');

    const response = await proxy(requestWithCookies(`${sharedConstants.cookieNames.accessToken}=access; ${sharedConstants.cookieNames.refreshToken}=refresh`));

    expect(response.cookies.getAll()).toEqual([]);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not refresh when no refresh token is present', async () => {
    const refresh = vi.spyOn(apiCaller.sessions, 'refreshAccessToken');

    await proxy(requestWithCookies('other=value'));

    expect(refresh).not.toHaveBeenCalled();
  });

  it('keeps the response unchanged when token refresh fails', async () => {
    vi.spyOn(apiCaller.sessions, 'refreshAccessToken').mockResolvedValue({ ok: false });

    const response = await proxy(requestWithCookies(`${sharedConstants.cookieNames.refreshToken}=refresh`));

    expect(response.cookies.getAll()).toEqual([]);
  });

  it('copies refreshed cookies and their supported attributes onto the response', async () => {
    const backendResponse = new Response(null, {
      headers: {
        'set-cookie':
          'accessToken=next-access; Path=/; Expires=Mon, 21 Oct 2030 07:28:00 GMT; HttpOnly; Secure; SameSite=Lax, refreshToken=next-refresh; Path=/api; Max-Age=3600; SameSite=Strict',
      },
    });
    vi.spyOn(apiCaller.sessions, 'refreshAccessToken').mockResolvedValue(backendResponse);

    const response = await proxy(requestWithCookies(`${sharedConstants.cookieNames.refreshToken}=old-refresh`));

    expect(response.cookies.get(sharedConstants.cookieNames.accessToken)?.value).toBe('next-access');
    expect(response.cookies.get(sharedConstants.cookieNames.refreshToken)?.value).toBe('next-refresh');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('Secure');
    expect(response.headers.get('set-cookie')).toContain('Expires=Mon, 21 Oct 2030 07:28:00 GMT');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=3600');
  });

  it('does not set cookies when the successful refresh has no Set-Cookie header', async () => {
    vi.spyOn(apiCaller.sessions, 'refreshAccessToken').mockResolvedValue(new Response(null));

    const response = await proxy(requestWithCookies(`${sharedConstants.cookieNames.refreshToken}=old-refresh`));

    expect(response.cookies.getAll()).toEqual([]);
  });

  it('ignores unsupported SameSite values and cookie attributes', async () => {
    vi.spyOn(apiCaller.sessions, 'refreshAccessToken').mockResolvedValue(
      new Response(null, {
        headers: {
          'set-cookie': 'accessToken=next-access; SameSite=unsupported; Priority=High',
        },
      }),
    );

    const response = await proxy(requestWithCookies(`${sharedConstants.cookieNames.refreshToken}=old-refresh`));

    expect(response.cookies.get(sharedConstants.cookieNames.accessToken)?.value).toBe('next-access');
    expect(response.headers.get('set-cookie')).not.toContain('SameSite');
  });
});
