import { env } from '@/libs/env';
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
    const baseUrl = isServerSide ? env.NEXT_PUBLIC_BACKEND_URL_FROM_SERVER_SIDE : env.NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE;

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
      console.info('Making fetch to', objectUrl.toString());

      const originalResponse = await makeFetch();
      if (originalResponse.status === 401) {
        console.warn('Access token expired, refreshing...');

        const refreshTokenUrl = new URL(`${baseUrl}/public/auth/session/refresh`);
        const refreshResponse = await fetch(refreshTokenUrl.toString(), {
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          console.info('Refresh succeeded, retrying original request...');

          return await makeFetch();
        } else {
          console.error('Refresh token failed');
          return { ok: false };
        }
      }

      return originalResponse;
    } catch (error) {
      console.error(error);
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
