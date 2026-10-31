import { getBackendUrl } from '@/libs/env';
import { withLoader } from '@/utils/hof';

export async function getCookies(): Promise<string> {
  if (typeof window !== 'undefined') {
    return document.cookie;
  }
  const { headers } = await import('next/headers');
  const headersResponse = await headers();
  const cookies = headersResponse.get('cookie') ?? '';
  return cookies;
}

const constructRequest = (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
  const requestFunction = async <T extends Record<string, unknown> | unknown[] | string>({
    url,
    queryParams = {},
    body,
  }: {
    url: string;
    queryParams?: Record<string, string | number | string[] | number[]>;
    body?: Record<string, unknown>;
  }): Promise<({ ok: true; json: () => Promise<T>; text: () => Promise<string> } & Response) | { ok: false }> => {
    const isServerSide = typeof window === 'undefined';
    const baseUrl = getBackendUrl(isServerSide);

    const objectUrl = new URL(baseUrl + url);
    const cookies = await getCookies();

    Object.entries(queryParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          objectUrl.searchParams.append(key, String(v));
        });
      } else {
        objectUrl.searchParams.append(key, String(value));
      }
    });

    const makeFetch = async (): Promise<Response> => {
      return fetch(objectUrl.toString(), {
        body: JSON.stringify(body),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies,
        },
        method,
      });
    };

    try {
      const originalResponse = await makeFetch();
      if (originalResponse.status === 401) {
        console.warn('Access token expired; refreshing session.');

        const refreshTokenUrl = new URL(`${baseUrl}/public/auth/session/refresh`);
        const refreshResponse = await fetch(refreshTokenUrl.toString(), {
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          return await makeFetch();
        } else {
          console.error('Session refresh failed', { path: refreshTokenUrl.pathname, status: refreshResponse.status });
          return { ok: false };
        }
      }

      return originalResponse;
    } catch (error) {
      console.error('Backend request failed', { error, method, path: objectUrl.pathname });
      return { ok: false };
    }
  };
  return requestFunction;
};

export const fetchers = {
  delete: withLoader(constructRequest('DELETE')),
  get: withLoader(constructRequest('GET')),
  post: withLoader(constructRequest('POST')),
  put: withLoader(constructRequest('PUT')),
};
