import { describe, expect, it } from 'vitest';
import { RolesController } from '../index';

describe('RolesController', () => {
  it('returns all roles', async () => {
    const roles = [{ id: 1, name: 'Editor' }];
    const controller = new RolesController({ roles: { getAll: async () => roles } } as never);

    await expect(controller.getAll()).resolves.toBe(roles);
  });

  it('creates roles using the validated body', async () => {
    const calls: unknown[] = [];
    const body = { description: 'Read-only access', name: 'Reader', permissions: ['user.read'] };
    const controller = new RolesController({ roles: { create: async (values: unknown) => calls.push(values) } } as never);

    await expect(controller.create(body)).resolves.toEqual({});
    expect(calls).toEqual([body]);
  });

  it('updates and removes the selected role', async () => {
    const updates: unknown[] = [];
    const removals: unknown[] = [];
    const controller = new RolesController({
      roles: {
        remove: async (input: unknown) => removals.push(input),
        update: async (input: unknown) => updates.push(input),
      },
    } as never);
    const body = { description: 'Updated role', name: 'Admin', permissions: [] };

    await expect(controller.update(5, body)).resolves.toEqual({});
    await expect(controller.remove(5)).resolves.toEqual({});
    expect(updates).toEqual([{ roleId: 5, updates: body }]);
    expect(removals).toEqual([{ roleId: 5 }]);
  });
});
