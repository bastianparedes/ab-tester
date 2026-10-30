import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { LifecycleHookController } from '../index';
import { copyLifecycleHookSchema } from '../request.schema';

describe('LifecycleHookController', () => {
  it('returns lifecycle-hook lists and a selected hook', async () => {
    const lifecycleHook = { id: 8, name: 'Start campaign' };
    const hooks = [lifecycleHook];
    const calls: unknown[] = [];
    const controller = new LifecycleHookController(
      {
        lifecycleHooks: {
          get: async (input: unknown) => {
            calls.push(input);
            return lifecycleHook;
          },
          getMany: async (input: unknown) => {
            calls.push(input);
            return hooks;
          },
        },
      } as never,
      {} as never,
    );
    const query = { page: 1, quantity: 10, textSearch: '' };

    await expect(controller.getMany(3, query as never)).resolves.toBe(hooks);
    await expect(controller.get(3, 8)).resolves.toEqual({ lifecycleHook });
    expect(calls).toEqual([
      { params: query, tenantId: 3 },
      { lifecycleHookId: 8, tenantId: 3 },
    ]);
  });

  it('throws when the requested hook does not exist', async () => {
    const controller = new LifecycleHookController({ lifecycleHooks: { get: async () => null } } as never, {} as never);

    await expect(controller.get(3, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('copies a lifecycle hook to a tenant where the user can create it', async () => {
    const calls: unknown[] = [];
    const controller = new LifecycleHookController(
      {
        lifecycleHooks: {
          copy: async (input: unknown) => calls.push(input),
        },
      } as never,
      { clear: async (input: unknown) => calls.push(input) } as never,
    );
    const request = {
      user: {
        id: 7,
        roles: [{ permissions: ['tenant.13.feature.lifecycle-hook.action.create'] }],
      },
    };

    expect(copyLifecycleHookSchema.parse({ extra: true, targetTenantId: 13 })).toEqual({ targetTenantId: 13 });
    expect(copyLifecycleHookSchema.safeParse({ targetTenantId: '13' }).success).toBe(false);
    await expect(controller.copy(3, 8, { targetTenantId: 13 }, request as never)).resolves.toEqual({});
    expect(calls).toEqual([{ lifecycleHookId: 8, targetTenantId: 13, tenantId: 3, userId: 7 }, { tenantId: 13 }]);

    await expect(controller.copy(3, 8, { targetTenantId: 13 }, { user: { id: 7, roles: [{ permissions: [] }] } } as never)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.copy(3, 8, { targetTenantId: 13 }, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires a user to create lifecycle hooks', async () => {
    const controller = new LifecycleHookController({ lifecycleHooks: {} } as never, {} as never);

    await expect(controller.create(3, {} as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates hooks and clears the generated script cache', async () => {
    const calls: unknown[] = [];
    const controller = new LifecycleHookController(
      { lifecycleHooks: { create: async (input: unknown) => calls.push(input) } } as never,
      { clear: async (input: unknown) => calls.push(input) } as never,
    );
    const body = { javascript: 'async () => { return true; }', name: 'Start', option: 'campaignStart', status: 'active' };

    await expect(controller.create(3, body as never, { user: { id: 7 } } as never)).resolves.toEqual({});
    expect(calls).toEqual([{ tenantId: 3, userId: 7, values: body }, { tenantId: 3 }]);
  });

  it('throws when updating or deleting a missing hook', async () => {
    const controller = new LifecycleHookController({ lifecycleHooks: { remove: async () => null, update: async () => null } } as never, {} as never);

    await expect(controller.update(3, 8, {} as never)).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.remove(3, 8)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates and removes hooks and clears the generated script cache', async () => {
    const calls: unknown[] = [];
    const controller = new LifecycleHookController(
      {
        lifecycleHooks: {
          remove: async (input: unknown) => {
            calls.push(input);
            return { id: 8 };
          },
          update: async (input: unknown) => {
            calls.push(input);
            return { id: 8 };
          },
        },
      } as never,
      { clear: async (input: unknown) => calls.push(input) } as never,
    );
    const body = { javascript: 'async () => { return true; }', name: 'Start', option: 'campaignStart', status: 'active' };

    await expect(controller.update(3, 8, body as never)).resolves.toEqual({});
    await expect(controller.remove(3, 8)).resolves.toEqual({});
    expect(calls).toEqual([{ lifecycleHookId: 8, tenantId: 3, values: body }, { tenantId: 3 }, { lifecycleHookId: 8, tenantId: 3 }, { tenantId: 3 }]);
  });
});
