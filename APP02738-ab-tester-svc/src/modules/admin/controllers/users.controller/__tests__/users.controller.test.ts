import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { generateToken } from '../../../../../libs/auth/jwt';
import { cookieNames } from '../../../../../libs/constants';
import { UsersController } from '../index';

const token = generateToken({ id: 23, purpose: 'access' });

describe('UsersController', () => {
  it('returns all users', async () => {
    const users = [{ id: 23, name: 'Ada' }];
    const controller = new UsersController({ users: { getAll: async () => users } } as never);

    await expect(controller.getAll()).resolves.toBe(users);
  });

  it('rejects user lookup when the access token is missing or invalid', async () => {
    const controller = new UsersController({ users: {} } as never);

    await expect(controller.get({ cookies: {} } as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.get({ cookies: { [cookieNames.accessToken]: 'invalid' } } as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects valid tokens when the user no longer exists', async () => {
    const controller = new UsersController({ users: { get: async () => null } } as never);

    await expect(controller.get({ cookies: { [cookieNames.accessToken]: token } } as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the user associated with a valid token', async () => {
    const user = { id: 23, name: 'Ada' };
    const requestedIds: number[] = [];
    const controller = new UsersController({
      users: {
        get: async ({ userId }: { userId: number }) => {
          requestedIds.push(userId);
          return user;
        },
      },
    } as never);

    await expect(controller.get({ cookies: { [cookieNames.accessToken]: token } } as never)).resolves.toBe(user);
    expect(requestedIds).toEqual([23]);
  });

  it('requires an authenticated user for create and update', async () => {
    const controller = new UsersController({ users: {} } as never);

    await expect(controller.create({ email: 'a@example.test', name: 'A', password: 'secret' }, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.update(23, { email: 'a@example.test', name: 'A', roleIds: [] }, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.remove(23, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates a user for an authenticated request', async () => {
    const calls: unknown[] = [];
    const controller = new UsersController({ users: { create: async (input: unknown) => calls.push(input) } } as never);
    const body = { email: 'ada@example.test', name: 'Ada', password: 'secret' };

    await expect(controller.create(body, { user: { id: 23 } } as never)).resolves.toEqual({});
    expect(calls).toEqual([body]);
  });

  it('rejects updates and removals for users that do not exist', async () => {
    const controller = new UsersController({ users: { get: async () => null } } as never);
    const request = { user: { id: 1 } };

    await expect(controller.update(23, { email: 'ada@example.test', name: 'Ada', roleIds: [] }, request as never)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.remove(23, request as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates and removes existing users', async () => {
    const calls: unknown[] = [];
    const controller = new UsersController({
      users: {
        get: async () => ({ id: 23 }),
        remove: async (input: unknown) => calls.push(input),
        update: async (input: unknown) => calls.push(input),
      },
    } as never);
    const body = { email: 'ada@example.test', name: 'Ada Lovelace', roleIds: [2, 3] };
    const request = { user: { id: 1 } };

    await expect(controller.update(23, body, request as never)).resolves.toEqual({});
    await expect(controller.remove(23, request as never)).resolves.toEqual({});
    expect(calls).toEqual([{ roleIds: body.roleIds, updates: body, userId: 23 }, { userId: 23 }]);
  });
});
