import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { getPasswordHashed } from '../../libs/auth/password';
import { AccountController } from '../account.controller';

describe('AccountController', () => {
  it('requires an authenticated user to change a password', async () => {
    const controller = new AccountController({ users: {} } as never);

    await expect(controller.updatePassword({ newPassword: 'new', oldPassword: 'old' }, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects password changes if the user cannot be found', async () => {
    const controller = new AccountController({ users: { getForLogin: async () => null } } as never);

    await expect(controller.updatePassword({ newPassword: 'new', oldPassword: 'old' }, { user: { email: 'ada@example.test' } } as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects password changes when the old password does not match', async () => {
    const passwordHash = getPasswordHashed('correct password');
    const controller = new AccountController({ users: { getForLogin: async () => ({ id: 23, passwordHash }) } } as never);

    await expect(
      controller.updatePassword({ newPassword: 'new password', oldPassword: 'wrong password' }, { user: { email: 'ada@example.test' } } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('updates the password after verifying the old password', async () => {
    const passwordHash = getPasswordHashed('old password');
    const calls: unknown[] = [];
    const controller = new AccountController({
      users: {
        getForLogin: async () => ({ id: 23, passwordHash }),
        updatePassword: async (input: unknown) => calls.push(input),
      },
    } as never);

    await expect(controller.updatePassword({ newPassword: 'new password', oldPassword: 'old password' }, { user: { email: 'ada@example.test' } } as never)).resolves.toEqual(
      {},
    );
    expect(calls).toEqual([{ newPassword: 'new password', userId: 23 }]);
  });

  it('requires authentication before updating account details', async () => {
    const controller = new AccountController({ users: {} } as never);

    await expect(controller.updateAccount({ email: 'new@example.test', name: 'Ada' }, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('updates account details using the current role ids', async () => {
    const calls: unknown[] = [];
    const controller = new AccountController({ users: { update: async (input: unknown) => calls.push(input) } } as never);
    const body = { email: 'new@example.test', name: 'Ada Lovelace' };

    await expect(controller.updateAccount(body, { user: { id: 23, roles: [{ id: 4 }, { id: 5 }] } } as never)).resolves.toEqual({});
    expect(calls).toEqual([{ roleIds: [4, 5], updates: body, userId: 23 }]);
  });
});
