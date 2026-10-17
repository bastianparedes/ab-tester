import type { TypeUser } from '@ab-tester/constants/types/user';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiCaller } from '@/libs/restClient';
import { getUserFromCookies } from '../index';

describe('getUserFromCookies', () => {
  const getUser = vi.spyOn(apiCaller.users, 'get');

  beforeEach(() => getUser.mockReset());

  it('returns a logged-out user when the API request fails', async () => {
    getUser.mockResolvedValue({ ok: false } as Awaited<ReturnType<typeof apiCaller.users.get>>);

    await expect(getUserFromCookies()).resolves.toEqual({ data: null, isLogedIn: false, permissions: [] });
  });

  it('returns the user and unique permissions in role order', async () => {
    const user: TypeUser = {
      email: 'ana@example.test',
      id: 7,
      name: 'Ana',
      roles: [
        { description: 'Read access', id: 1, name: 'Reader', permissions: ['campaign:read', 'user:read'] },
        { description: 'Campaign access', id: 2, name: 'Campaign editor', permissions: ['campaign:read', 'campaign:write'] },
      ],
    };
    getUser.mockResolvedValue({ json: async () => user, ok: true } as Awaited<ReturnType<typeof apiCaller.users.get>>);

    await expect(getUserFromCookies()).resolves.toEqual({
      data: user,
      isLogedIn: true,
      permissions: ['campaign:read', 'user:read', 'campaign:write'],
    });
  });

  it('falls back to an empty permission list if role reduction returns no value', async () => {
    const user: TypeUser = {
      email: 'ana@example.test',
      id: 7,
      name: 'Ana',
      roles: new Proxy([], {
        get(target, property, receiver) {
          if (property === 'reduce') return () => null;
          return Reflect.get(target, property, receiver);
        },
      }),
    };
    getUser.mockResolvedValue({ json: async () => user, ok: true } as Awaited<ReturnType<typeof apiCaller.users.get>>);

    await expect(getUserFromCookies()).resolves.toEqual({ data: user, isLogedIn: true, permissions: [] });
  });
});
