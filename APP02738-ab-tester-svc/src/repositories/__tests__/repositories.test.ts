import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { db } = vi.hoisted(() => {
  const makeQuery = () => ({ findFirst: vi.fn(), findMany: vi.fn() });

  return {
    db: {
      delete: vi.fn(),
      insert: vi.fn(),
      query: {
        audiences: makeQuery(),
        campaigns: makeQuery(),
        executionGroups: makeQuery(),
        lifecycleHooks: makeQuery(),
        rolePermissions: makeQuery(),
        roles: makeQuery(),
        tenants: makeQuery(),
        trackEvents: makeQuery(),
        users: makeQuery(),
      },
      select: vi.fn(),
      transaction: vi.fn(),
      update: vi.fn(),
    },
  };
});

vi.mock('../postgres/client', () => ({ default: db }));

import { AudienceRepository } from '../audience.repository';
import { CampaignRepository } from '../campaign.repository';
import { ExecutionGroupRepository } from '../executionGroup.repository';
import { LifecycleHookRepository } from '../lifecycleHook.repository';
import * as schema from '../postgres/schema';
import { RoleRepository } from '../role.repository';
import { TenantRepository } from '../tenant.repository';
import { TrackEventRepository } from '../trackEvent.repository';
import { UserRepository } from '../user.repository';

const createQuery = (result: unknown) => {
  const query: Record<string, unknown> = {};
  for (const method of ['from', 'where', 'leftJoin', 'groupBy', 'orderBy', 'limit', 'offset', 'values', 'set', 'returning']) {
    query[method] = vi.fn(() => query);
  }
  Object.defineProperty(query, 'then', {
    value: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject),
  });
  return query;
};

describe('repositories', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.transaction.mockImplementation((callback) => callback(db));
  });

  it('creates, updates, queries, and removes audiences', async () => {
    const repository = new AudienceRepository();
    const audience = { id: 2, name: 'Returning customers' };
    const values = { name: audience.name, requirements: {} };
    db.insert.mockReturnValueOnce(createQuery([audience]));
    db.update.mockReturnValueOnce(createQuery([audience]));
    db.select.mockReturnValueOnce(createQuery([])).mockReturnValueOnce(createQuery([{ count: '1' }]));
    db.delete.mockReturnValueOnce(createQuery([audience]));
    db.query.audiences.findMany.mockResolvedValueOnce([audience]).mockResolvedValueOnce([audience]);
    db.query.audiences.findFirst.mockResolvedValueOnce(audience);

    await expect(repository.create({ tenantId: 3, userId: 4, values } as never)).resolves.toEqual([audience]);
    await expect(repository.update({ audienceId: 2, tenantId: 3, updates: values, userId: 4 } as never)).resolves.toEqual([audience]);
    await expect(
      repository.getMany({
        params: { orderBy: 'name', orderDirection: 'asc', page: 1, quantity: 10, textSearch: ' customer ' },
        tenantId: 3,
      } as never),
    ).resolves.toEqual({ audiences: [], count: 1 });
    await expect(repository.getAllForCampaign({ tenantId: 3 })).resolves.toEqual([audience]);
    await expect(repository.get({ audienceId: 2, tenantId: 3 })).resolves.toBe(audience);
    await expect(repository.getAllAudiencesForScript({ tenantId: 3 })).resolves.toEqual([audience]);
    db.select.mockReturnValueOnce(createQuery([]));
    await expect(repository.remove({ audienceId: 2, tenantId: 3 })).resolves.toBe(audience);

    db.select.mockReturnValueOnce(createQuery([{ id: 11 }, { id: 12 }]));
    await expect(repository.remove({ audienceId: 2, tenantId: 3 })).rejects.toThrow(ConflictException);
  });

  it('creates, updates, queries, and filters campaigns', async () => {
    const repository = new CampaignRepository();
    const campaign = { id: 2, name: 'Spring campaign', triggers: [{}], variations: [{ traffic: 100 }] };
    const values = { name: campaign.name };
    db.insert.mockReturnValueOnce(createQuery([campaign]));
    db.update.mockReturnValueOnce(createQuery([campaign]));
    db.delete.mockReturnValueOnce(createQuery([campaign]));
    db.select.mockReturnValueOnce(createQuery([campaign])).mockReturnValueOnce(createQuery([{ count: '1' }]));
    db.query.campaigns.findMany.mockResolvedValueOnce([campaign]).mockResolvedValueOnce([campaign, { ...campaign, variations: [] }, { ...campaign, triggers: [] }]);
    db.query.campaigns.findFirst.mockResolvedValueOnce(campaign);

    await expect(repository.create({ tenantId: 3, userId: 4, values } as never)).resolves.toEqual([campaign]);
    await expect(repository.update({ campaignId: 2, tenantId: 3, updates: values, userId: 4 } as never)).resolves.toEqual([campaign]);
    await expect(repository.remove({ campaignId: 2, tenantId: 3 })).resolves.toBe(campaign);
    await expect(
      repository.getMany({
        params: { orderBy: 'name', orderDirection: 'desc', page: 1, quantity: 10, statusList: ['active'], textSearch: ' spring ' },
        tenantId: 3,
      } as never),
    ).resolves.toEqual({ campaigns: [campaign], count: 1 });
    await expect(repository.getAllForExecutionGroup({ tenantId: 3 })).resolves.toEqual([campaign]);
    await expect(repository.get({ campaignId: 2, tenantId: 3 })).resolves.toBe(campaign);
    await expect(repository.getAllCampaignsForScript({ tenantId: 3 })).resolves.toEqual([campaign]);
    const whereCampaigns = db.query.campaigns.findMany.mock.calls.at(-1)?.[0].where as (table: typeof schema.campaigns) => unknown;
    expect(whereCampaigns(schema.campaigns)).toBeDefined();

    db.query.campaigns.findMany.mockResolvedValueOnce([
      { ...campaign, triggers: [{}], variations: [] },
      { ...campaign, triggers: [], variations: [{ traffic: 100 }] },
    ]);
    await expect(repository.getAllCampaignsForScript({ tenantId: 3 })).resolves.toEqual([]);
  });

  it('manages execution group transactions and filters script campaigns', async () => {
    const repository = new ExecutionGroupRepository();
    const group = { campaigns: [{ id: 2 }], id: 5, name: 'Homepage' };
    const values = { name: group.name };
    db.insert.mockReturnValueOnce(createQuery([group]));
    db.update
      .mockReturnValueOnce(createQuery(undefined))
      .mockReturnValueOnce(createQuery([group]))
      .mockReturnValueOnce(createQuery(undefined))
      .mockReturnValueOnce(createQuery(undefined))
      .mockReturnValueOnce(createQuery(undefined))
      .mockReturnValueOnce(createQuery(undefined))
      .mockReturnValueOnce(createQuery(undefined));
    db.select
      .mockReturnValueOnce(createQuery([{ id: 2 }, { id: 3 }]))
      .mockReturnValueOnce(createQuery([{ id: 2 }, { id: 3 }]))
      .mockReturnValueOnce(createQuery([{ count: '1' }]));
    db.delete.mockReturnValueOnce(createQuery([group]));
    db.query.executionGroups.findFirst.mockResolvedValueOnce(group).mockResolvedValueOnce(undefined);
    db.query.executionGroups.findMany.mockResolvedValueOnce([
      {
        ...group,
        campaigns: [
          { id: 2, triggers: [{}], variations: [{ css: '', html: '<p>x</p>', javascript: '', traffic: 100 }] },
          { id: 3, triggers: [], variations: [{ css: '', html: '<p>x</p>', javascript: '', traffic: 100 }] },
          { id: 4, triggers: [{}], variations: [{ css: '', html: '', javascript: '', traffic: 0 }] },
        ],
      },
      { ...group, campaigns: [], id: 6 },
    ]);

    await expect(repository.create({ campaignIds: [2], tenantId: 3, userId: 4, values } as never)).resolves.toBe(group);
    await expect(repository.update({ campaignIds: [3], executionGroupId: 5, tenantId: 3, userId: 4, values } as never)).resolves.toBe(group);
    await expect(repository.remove({ executionGroupId: 5, tenantId: 3 })).resolves.toBe(group);
    await expect(
      repository.getMany({
        params: { orderBy: 'name', orderDirection: 'asc', page: 0, quantity: 10, statusList: ['active'], textSearch: ' home ' },
        tenantId: 3,
      } as never),
    ).resolves.toEqual({ count: 1, executionGroups: [{ id: 2 }, { id: 3 }] });
    await expect(repository.get({ executionGroupId: 5, tenantId: 3 })).resolves.toEqual({ campaigns: group.campaigns, executionGroup: { id: 5, name: 'Homepage' } });
    await expect(repository.get({ executionGroupId: 6, tenantId: 3 })).resolves.toBeUndefined();
    await expect(repository.getAllExecutionGroupsForScript({ tenantId: 3 })).resolves.toEqual([{ ...group, campaigns: [2, 3, 4] }]);

    db.query.executionGroups.findMany.mockResolvedValueOnce([
      { ...group, campaigns: [{ id: 5, triggers: [{}], variations: [{ css: '.x{}', html: '', javascript: '', traffic: 1 }] }] },
    ]);
    await expect(repository.getAllExecutionGroupsForScript({ tenantId: 3 })).resolves.toEqual([{ ...group, campaigns: [5] }]);
  });

  it('creates, updates, and queries lifecycle hooks', async () => {
    const repository = new LifecycleHookRepository();
    const hook = { id: 7, name: 'After campaign', status: 'active' };
    const values = { name: hook.name, status: hook.status };
    db.insert.mockReturnValueOnce(createQuery([hook]));
    db.update.mockReturnValueOnce(createQuery([hook]));
    db.delete.mockReturnValueOnce(createQuery([hook]));
    db.select.mockReturnValueOnce(createQuery([hook])).mockReturnValueOnce(createQuery([{ count: 1 }]));
    db.query.lifecycleHooks.findFirst.mockResolvedValueOnce(hook);
    db.query.lifecycleHooks.findMany.mockResolvedValueOnce([hook]);

    await expect(repository.create({ tenantId: 3, userId: 4, values } as never)).resolves.toBe(hook);
    await expect(repository.update({ lifecycleHookId: 7, tenantId: 3, values } as never)).resolves.toBe(hook);
    await expect(repository.remove({ lifecycleHookId: 7, tenantId: 3 })).resolves.toBe(hook);
    await expect(repository.get({ lifecycleHookId: 7, tenantId: 3 })).resolves.toBe(hook);
    await expect(
      repository.getMany({
        params: { orderBy: 'name', orderDirection: 'desc', page: 0, quantity: 10, statusList: ['active'], textSearch: ' hook ' },
        tenantId: 3,
      } as never),
    ).resolves.toEqual({ count: 1, lifecycleHooks: [hook] });
    await expect(repository.getAllLifecycleHooksForScript({ tenantId: 3 })).resolves.toEqual([hook]);
  });

  it('maps role permissions and updates permission associations', async () => {
    const repository = new RoleRepository();
    const role = { description: '', id: 2, name: 'Editor', rolePermissions: [{ permission: { name: 'campaign:read' } }] };
    db.query.roles.findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(role).mockResolvedValueOnce(undefined).mockResolvedValueOnce(role);
    db.query.roles.findMany.mockResolvedValueOnce([role]);
    db.transaction.mockImplementationOnce(async (callback) => callback(db));
    db.update.mockReturnValueOnce(createQuery([{ id: 2, name: 'Editor' }]));
    db.query.rolePermissions.findMany.mockResolvedValueOnce([{ permission: { name: 'campaign:read' } }]);
    db.select.mockReturnValueOnce(createQuery([{ id: 9 }])).mockReturnValueOnce(createQuery([{ id: 10, name: 'campaign:update' }]));
    db.delete.mockReturnValueOnce(createQuery(undefined)).mockReturnValueOnce(createQuery(undefined));
    db.insert
      .mockReturnValueOnce(createQuery(undefined))
      .mockReturnValueOnce(createQuery([{ id: 11, name: 'campaign:create' }]))
      .mockReturnValueOnce(createQuery(undefined));

    await expect(repository.get({ id: 2 })).resolves.toBeNull();
    await expect(repository.get({ id: 2 })).resolves.toEqual({ description: '', id: 2, name: 'Editor', permissions: ['campaign:read'] });
    await expect(repository.create({ description: '', name: 'Editor', permissions: [] } as never)).resolves.toBeUndefined();
    await expect(repository.update({ roleId: 99, updates: { description: '', name: 'Missing', permissions: [] } as never })).rejects.toThrow('Role not found');
    await expect(
      repository.update({
        roleId: 2,
        updates: { description: '', name: 'Editor', permissions: ['campaign:update', 'campaign:create'] } as never,
      }),
    ).resolves.toEqual({ id: 2, name: 'Editor', permissions: ['campaign:update', 'campaign:create'] });
    await expect(repository.getAll()).resolves.toEqual([{ description: '', id: 2, name: 'Editor', permissions: ['campaign:read'] }]);
    await expect(repository.remove({ roleId: 2 })).resolves.toBeUndefined();

    db.query.roles.findFirst.mockResolvedValueOnce(role);
    db.update.mockReturnValueOnce(createQuery([role]));
    db.query.rolePermissions.findMany.mockResolvedValueOnce([{ permission: { name: 'campaign:read' } }]);
    db.select.mockReturnValueOnce(createQuery([]));
    db.update.mockReturnValueOnce(createQuery([role]));
    await expect(repository.update({ roleId: 2, updates: { description: '', name: 'Editor', permissions: [] } as never })).resolves.toMatchObject({
      permissions: [],
    });
  });

  it('reuses existing permissions when adding them to a role', async () => {
    const repository = new RoleRepository();
    db.query.roles.findFirst.mockResolvedValueOnce({ description: '', id: 2, name: 'Editor', rolePermissions: [] });
    db.update.mockReturnValueOnce(createQuery([{ id: 2, name: 'Editor' }]));
    db.query.rolePermissions.findMany.mockResolvedValueOnce([]);
    db.select.mockReturnValueOnce(createQuery([{ id: 10, name: 'campaign:read' }]));
    db.insert.mockReturnValueOnce(createQuery(undefined));

    await expect(
      repository.update({
        roleId: 2,
        updates: { description: '', name: 'Editor', permissions: ['campaign:read'] } as never,
      }),
    ).resolves.toEqual({ id: 2, name: 'Editor', permissions: ['campaign:read'] });
  });

  it('creates, updates, reads, lists, and removes tenants', async () => {
    const repository = new TenantRepository();
    const tenant = { id: 3, name: 'Acme' };
    db.insert.mockReturnValueOnce(createQuery([tenant]));
    db.update.mockReturnValueOnce(createQuery([tenant]));
    db.query.tenants.findFirst.mockResolvedValueOnce(tenant);
    db.select.mockReturnValueOnce(createQuery([tenant]));
    db.delete.mockReturnValueOnce(createQuery([tenant]));

    await expect(repository.create({ description: '', domain: 'acme.test', name: 'Acme' } as never)).resolves.toBe(tenant);
    await expect(repository.update({ tenantId: 3, values: { description: '', domain: 'acme.test', name: 'Acme' } as never })).resolves.toBe(tenant);
    await expect(repository.get({ tenantId: 3 })).resolves.toBe(tenant);
    await expect(repository.getAll()).resolves.toEqual([tenant]);
    await expect(repository.remove({ tenantId: 3 })).resolves.toBe(tenant);
  });

  it('creates, updates, queries, filters, and removes track events', async () => {
    const repository = new TrackEventRepository();
    const event = { id: 5, javascript: 'async () => { return event; }', name: 'Purchase', status: 'active' };
    const values = { javascript: event.javascript, name: event.name, status: event.status };
    db.insert.mockReturnValueOnce(createQuery([event]));
    db.update.mockReturnValueOnce(createQuery([event]));
    db.select
      .mockReturnValueOnce(createQuery([]))
      .mockReturnValueOnce(createQuery([event]))
      .mockReturnValueOnce(createQuery([{ count: '1' }]));
    db.delete.mockReturnValueOnce(createQuery([event]));
    db.query.trackEvents.findMany.mockResolvedValueOnce([event]).mockResolvedValueOnce([event, { ...event, javascript: '' }]);
    db.query.trackEvents.findFirst.mockResolvedValueOnce(event);

    await expect(repository.create({ tenantId: 3, userId: 4, values } as never)).resolves.toBe(event);
    await expect(repository.update({ tenantId: 3, trackEventId: 5, userId: 4, values } as never)).resolves.toBe(event);
    await expect(repository.remove({ tenantId: 3, trackEventId: 5 })).resolves.toBe(event);
    await expect(
      repository.getMany({
        params: { orderBy: 'name', orderDirection: 'asc', page: 0, quantity: 10, textSearch: ' purchase ' },
        tenantId: 3,
      } as never),
    ).resolves.toEqual({ count: 1, trackEvents: [event] });
    await expect(repository.getAllForAudience({ tenantId: 3 })).resolves.toEqual([event]);
    await expect(repository.get({ tenantId: 3, trackEventId: 5 })).resolves.toBe(event);
    await expect(repository.getAllTrackEventsForScript({ tenantId: 3 })).resolves.toEqual([event]);

    db.select.mockReturnValueOnce(createQuery([{ id: 8 }, { id: 9 }]));
    await expect(repository.remove({ tenantId: 3, trackEventId: 5 })).rejects.toThrow(ConflictException);
  });

  it('maps users and synchronizes password and role data', async () => {
    const repository = new UserRepository();
    const user = {
      email: 'ada@example.test',
      id: 3,
      name: 'Ada',
      userRoles: [{ role: { id: 4, name: 'Editor', rolePermissions: [{ permission: { name: 'campaign:read' } }] } }],
    };
    db.query.users.findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(user).mockResolvedValueOnce({ email: user.email, id: 3, passwordHash: 'hash' });
    db.query.users.findMany.mockResolvedValueOnce([user]);
    db.insert.mockReturnValueOnce(createQuery(undefined)).mockReturnValueOnce(createQuery(undefined));
    db.update.mockReturnValueOnce(createQuery(undefined)).mockReturnValueOnce(createQuery(undefined)).mockReturnValueOnce(createQuery(undefined));
    db.select.mockReturnValueOnce(createQuery([{ roleId: 1 }, { roleId: 2 }]));
    db.delete.mockReturnValueOnce(createQuery(undefined)).mockReturnValueOnce(createQuery(undefined)).mockReturnValueOnce(createQuery(undefined));

    await expect(repository.get({ userId: 3 })).resolves.toBeNull();
    await expect(repository.get({ userId: 3 })).resolves.toEqual({
      email: user.email,
      id: 3,
      name: 'Ada',
      roles: [{ id: 4, name: 'Editor', permissions: ['campaign:read'] }],
    });
    await expect(repository.create({ email: user.email, name: user.name, password: 'secret' } as never)).resolves.toBeUndefined();
    await expect(repository.update({ roleIds: [2, 3], updates: { email: user.email, name: 'Ada' }, userId: 3 } as never)).resolves.toBeUndefined();
    await expect(repository.updatePassword({ newPassword: 'new-secret', userId: 3 })).resolves.toBeUndefined();
    await expect(repository.getForLogin({ email: user.email })).resolves.toEqual({ email: user.email, id: 3, passwordHash: 'hash' });
    await expect(repository.getAll()).resolves.toEqual([{ email: user.email, id: 3, name: 'Ada', roles: [{ id: 4, name: 'Editor', permissions: ['campaign:read'] }] }]);
    await expect(repository.remove({ userId: 3 })).resolves.toBeUndefined();

    db.select.mockReturnValueOnce(createQuery([]));
    await expect(repository.update({ roleIds: [], updates: { email: user.email, name: 'Ada' }, userId: 3 } as never)).resolves.toBeUndefined();
  });
});
