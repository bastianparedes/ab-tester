import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { TenantsController } from '../tenants.controller';

describe('TenantsController', () => {
  it('returns all tenants and a selected tenant', async () => {
    const tenants = [{ id: 1, name: 'Acme' }];
    const tenant = tenants[0];
    const controller = new TenantsController({ tenants: { get: async () => tenant, getAll: async () => tenants } } as never);

    await expect(controller.getAll()).resolves.toBe(tenants);
    await expect(controller.get(tenant.id)).resolves.toBe(tenant);
  });

  it('throws when the requested tenant does not exist', async () => {
    const controller = new TenantsController({ tenants: { get: async () => null } } as never);

    await expect(controller.get(100)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates and updates tenants with the expected input', async () => {
    const calls: unknown[] = [];
    const tenant = { description: 'Test tenant', domain: 'example.test', name: 'Test' };
    const controller = new TenantsController({
      tenants: {
        create: async (values: unknown) => {
          calls.push(values);
          return tenant;
        },
        update: async (values: unknown) => {
          calls.push(values);
          return tenant;
        },
      },
    } as never);

    await expect(controller.create(tenant)).resolves.toBe(tenant);
    await expect(controller.update(8, tenant)).resolves.toBe(tenant);
    expect(calls).toEqual([tenant, { tenantId: 8, values: tenant }]);
  });

  it('returns a removed tenant and throws if none was removed', async () => {
    const removedTenant = { id: 8, name: 'Removed' };
    const controller = new TenantsController({ tenants: { remove: async () => removedTenant } } as never);

    await expect(controller.remove(8)).resolves.toBe(removedTenant);

    const missingController = new TenantsController({ tenants: { remove: async () => null } } as never);
    await expect(missingController.remove(8)).rejects.toBeInstanceOf(NotFoundException);
  });
});
