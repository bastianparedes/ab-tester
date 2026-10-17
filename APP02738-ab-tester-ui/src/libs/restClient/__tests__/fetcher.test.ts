import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedHeaders } = vi.hoisted(() => ({ mockedHeaders: vi.fn() }));

vi.mock('next/headers', () => ({
  headers: mockedHeaders,
}));

describe('fetchers', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let fetchers: typeof import('../fetcher').fetchers;

  beforeEach(async () => {
    vi.resetModules();
    mockedHeaders.mockResolvedValue(new Headers({ cookie: 'server=session-ssr' }));
    vi.stubEnv('NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE', 'https://client.example/api');
    vi.stubEnv('NEXT_PUBLIC_BACKEND_URL_FROM_SERVER_SIDE', 'https://server.example/api');
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { cookie: 'session=abc123' });
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    ({ fetchers } = await import('../fetcher'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('encodes scalar and repeated query parameters and forwards cookies', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));

    await fetchers.get({ queryParams: { page: 2, tag: ['blue', 'red'] }, url: '/campaigns' });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://client.example/api/campaigns?page=2&tag=blue&tag=red');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json', Cookie: 'session=abc123' });
    expect(options.credentials).toBe('include');
    expect(options.method).toBe('GET');
  });

  it('sends JSON bodies with the requested method', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));

    await fetchers.post({ body: { name: 'Launch' }, url: '/campaigns' });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(options.body).toBe('{"name":"Launch"}');
  });

  it('uses server-side URL and cookies when running outside the browser', async () => {
    vi.stubGlobal('window', undefined);
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));

    await fetchers.get({ url: '/campaigns' });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://server.example/api/campaigns');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json', Cookie: 'server=session-ssr' });
  });

  it('uses an empty cookie when the server request has no cookie header', async () => {
    vi.stubGlobal('window', undefined);
    mockedHeaders.mockResolvedValueOnce(new Headers());
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));

    await fetchers.get({ url: '/campaigns' });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.headers).toEqual({ 'Content-Type': 'application/json', Cookie: '' });
  });

  it('refreshes an expired session and retries the original request', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

    const response = await fetchers.get({ url: '/campaigns' });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('https://client.example/api/public/auth/session/refresh');
    expect(fetchMock.mock.calls[2][0]).toBe('https://client.example/api/campaigns');
  });

  it('returns a failure result when session refresh fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(fetchers.get({ url: '/campaigns' })).resolves.toEqual({ ok: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns a failure result when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(fetchers.get({ url: '/campaigns' })).resolves.toEqual({ ok: false });
  });
});
