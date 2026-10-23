import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchers } from '../../fetcher';
import { audiences } from '../audiences';
import { campaigns } from '../campaigns';
import { executionGroups } from '../executionGroups';
import { lifecycleHooks } from '../lifecycleHooks';
import { roles } from '../roles';
import { scripts } from '../scripts';
import { sessions } from '../sessions';
import { tenants } from '../tenants';
import { trackEvents } from '../trackEvents';
import { users } from '../users';

type FetchMethod = 'delete' | 'get' | 'post' | 'put';

type ApiCase = {
  expected: { body?: unknown; queryParams?: unknown; url: string };
  invoke: () => Promise<unknown>;
  method: FetchMethod;
  name: string;
};

const requestData = <T>(data: unknown): T => data as T;
const body = { name: 'Example' };
const queryParams = { page: 2, search: 'example' };
const tenantId = 'tenant-1';
const campaignId = 'campaign-1';
const audienceId = 'audience-1';
const executionGroupId = 'group-1';
const lifecycleHookId = 'hook-1';
const trackEventId = 'event-1';
const targetTenantId = 'tenant-2';
const roleId = 'role-1';
const userId = 'user-1';

const apiCases: ApiCase[] = [
  {
    expected: { body: { targetTenantId }, url: '/tenants/tenant-1/audiences/audience-1/copy' },
    invoke: () =>
      audiences.copy(
        requestData<Parameters<typeof audiences.copy>[0]>({
          body: { targetTenantId },
          pathParams: { audienceId, tenantId },
        }),
      ),
    method: 'post',
    name: 'audiences.copy',
  },
  {
    expected: { body, url: '/tenants/tenant-1/audiences' },
    invoke: () => audiences.create(requestData<Parameters<typeof audiences.create>[0]>({ body, pathParams: { tenantId } })),
    method: 'post',
    name: 'audiences.create',
  },
  {
    expected: { url: '/tenants/tenant-1/audiences/audience-1' },
    invoke: () => audiences.delete(requestData<Parameters<typeof audiences.delete>[0]>({ pathParams: { audienceId, tenantId } })),
    method: 'delete',
    name: 'audiences.delete',
  },
  {
    expected: { url: '/tenants/tenant-1/audiences/audience-1' },
    invoke: () => audiences.get(requestData<Parameters<typeof audiences.get>[0]>({ pathParams: { audienceId, tenantId } })),
    method: 'get',
    name: 'audiences.get',
  },
  {
    expected: { url: '/tenants/tenant-1/audiences/getAllForCampaign' },
    invoke: () => audiences.getAllForCampaign(requestData<Parameters<typeof audiences.getAllForCampaign>[0]>({ pathParams: { campaignId, tenantId } })),
    method: 'get',
    name: 'audiences.getAllForCampaign',
  },
  {
    expected: { queryParams, url: '/tenants/tenant-1/audiences' },
    invoke: () => audiences.getMany(requestData<Parameters<typeof audiences.getMany>[0]>({ pathParams: { tenantId }, queryParams })),
    method: 'get',
    name: 'audiences.getMany',
  },
  {
    expected: { body, url: '/tenants/tenant-1/audiences/audience-1' },
    invoke: () => audiences.update(requestData<Parameters<typeof audiences.update>[0]>({ body, pathParams: { audienceId, tenantId } })),
    method: 'put',
    name: 'audiences.update',
  },
  {
    expected: { body, url: '/tenants/tenant-1/campaigns' },
    invoke: () => campaigns.create(requestData<Parameters<typeof campaigns.create>[0]>({ body, pathParams: { tenantId } })),
    method: 'post',
    name: 'campaigns.create',
  },
  {
    expected: { body: { targetTenantId }, url: '/tenants/tenant-1/campaigns/campaign-1/copy' },
    invoke: () =>
      campaigns.copy(
        requestData<Parameters<typeof campaigns.copy>[0]>({
          body: { targetTenantId },
          pathParams: { campaignId, tenantId },
        }),
      ),
    method: 'post',
    name: 'campaigns.copy',
  },
  {
    expected: { body: { targetTenantId }, url: '/tenants/tenant-1/campaigns/campaign-1/copy' },
    invoke: () =>
      campaigns.copy(
        requestData<Parameters<typeof campaigns.copy>[0]>({
          body: { targetTenantId },
          pathParams: { campaignId, tenantId },
        }),
      ),
    method: 'post',
    name: 'campaigns.copy',
  },
  {
    expected: { url: '/tenants/tenant-1/campaigns/campaign-1' },
    invoke: () => campaigns.delete(requestData<Parameters<typeof campaigns.delete>[0]>({ pathParams: { campaignId, tenantId } })),
    method: 'delete',
    name: 'campaigns.delete',
  },
  {
    expected: { url: '/tenants/tenant-1/campaigns/campaign-1' },
    invoke: () => campaigns.get(requestData<Parameters<typeof campaigns.get>[0]>({ pathParams: { campaignId, tenantId } })),
    method: 'get',
    name: 'campaigns.get',
  },
  {
    expected: { url: '/tenants/tenant-1/campaigns/getAllForExecutionGroup' },
    invoke: () => campaigns.getAllForExecutionGroup(requestData<Parameters<typeof campaigns.getAllForExecutionGroup>[0]>({ pathParams: { executionGroupId, tenantId } })),
    method: 'get',
    name: 'campaigns.getAllForExecutionGroup',
  },
  {
    expected: { queryParams, url: '/tenants/tenant-1/campaigns' },
    invoke: () => campaigns.getMany(requestData<Parameters<typeof campaigns.getMany>[0]>({ pathParams: { tenantId }, queryParams })),
    method: 'get',
    name: 'campaigns.getMany',
  },
  {
    expected: { body, url: '/tenants/tenant-1/campaigns/campaign-1' },
    invoke: () => campaigns.update(requestData<Parameters<typeof campaigns.update>[0]>({ body, pathParams: { campaignId, tenantId } })),
    method: 'put',
    name: 'campaigns.update',
  },
  {
    expected: { body, url: '/tenants/tenant-1/execution-groups' },
    invoke: () => executionGroups.create(requestData<Parameters<typeof executionGroups.create>[0]>({ body, pathParams: { tenantId } })),
    method: 'post',
    name: 'executionGroups.create',
  },
  {
    expected: { body: { targetTenantId }, url: '/tenants/tenant-1/execution-groups/group-1/copy' },
    invoke: () =>
      executionGroups.copy(
        requestData<Parameters<typeof executionGroups.copy>[0]>({
          body: { targetTenantId },
          pathParams: { executionGroupId, tenantId },
        }),
      ),
    method: 'post',
    name: 'executionGroups.copy',
  },
  {
    expected: { url: '/tenants/tenant-1/execution-groups/group-1' },
    invoke: () => executionGroups.delete(requestData<Parameters<typeof executionGroups.delete>[0]>({ pathParams: { executionGroupId, tenantId } })),
    method: 'delete',
    name: 'executionGroups.delete',
  },
  {
    expected: { url: '/tenants/tenant-1/execution-groups/group-1' },
    invoke: () => executionGroups.get(requestData<Parameters<typeof executionGroups.get>[0]>({ pathParams: { executionGroupId, tenantId } })),
    method: 'get',
    name: 'executionGroups.get',
  },
  {
    expected: { queryParams, url: '/tenants/tenant-1/execution-groups' },
    invoke: () => executionGroups.getMany(requestData<Parameters<typeof executionGroups.getMany>[0]>({ pathParams: { tenantId }, queryParams })),
    method: 'get',
    name: 'executionGroups.getMany',
  },
  {
    expected: { body, url: '/tenants/tenant-1/execution-groups/group-1' },
    invoke: () => executionGroups.update(requestData<Parameters<typeof executionGroups.update>[0]>({ body, pathParams: { executionGroupId, tenantId } })),
    method: 'put',
    name: 'executionGroups.update',
  },
  {
    expected: { body, url: '/tenants/tenant-1/lifecycle-hooks' },
    invoke: () => lifecycleHooks.create(requestData<Parameters<typeof lifecycleHooks.create>[0]>({ body, pathParams: { tenantId } })),
    method: 'post',
    name: 'lifecycleHooks.create',
  },
  {
    expected: { body: { targetTenantId }, url: '/tenants/tenant-1/lifecycle-hooks/hook-1/copy' },
    invoke: () =>
      lifecycleHooks.copy(
        requestData<Parameters<typeof lifecycleHooks.copy>[0]>({
          body: { targetTenantId },
          pathParams: { lifecycleHookId, tenantId },
        }),
      ),
    method: 'post',
    name: 'lifecycleHooks.copy',
  },
  {
    expected: { url: '/tenants/tenant-1/lifecycle-hooks/hook-1' },
    invoke: () => lifecycleHooks.delete(requestData<Parameters<typeof lifecycleHooks.delete>[0]>({ pathParams: { lifecycleHookId, tenantId } })),
    method: 'delete',
    name: 'lifecycleHooks.delete',
  },
  {
    expected: { url: '/tenants/tenant-1/lifecycle-hooks/hook-1' },
    invoke: () => lifecycleHooks.get(requestData<Parameters<typeof lifecycleHooks.get>[0]>({ pathParams: { lifecycleHookId, tenantId } })),
    method: 'get',
    name: 'lifecycleHooks.get',
  },
  {
    expected: { queryParams, url: '/tenants/tenant-1/lifecycle-hooks' },
    invoke: () => lifecycleHooks.getMany(requestData<Parameters<typeof lifecycleHooks.getMany>[0]>({ pathParams: { tenantId }, queryParams })),
    method: 'get',
    name: 'lifecycleHooks.getMany',
  },
  {
    expected: { body, url: '/tenants/tenant-1/lifecycle-hooks/hook-1' },
    invoke: () => lifecycleHooks.update(requestData<Parameters<typeof lifecycleHooks.update>[0]>({ body, pathParams: { lifecycleHookId, tenantId } })),
    method: 'put',
    name: 'lifecycleHooks.update',
  },
  {
    expected: { body, url: '/admin/roles' },
    invoke: () => roles.create(requestData<Parameters<typeof roles.create>[0]>({ body })),
    method: 'post',
    name: 'roles.create',
  },
  {
    expected: { url: '/admin/roles/role-1' },
    invoke: () => roles.delete(requestData<Parameters<typeof roles.delete>[0]>({ pathParams: { roleId } })),
    method: 'delete',
    name: 'roles.delete',
  },
  { expected: { url: '/admin/roles' }, invoke: () => roles.getAll(), method: 'get', name: 'roles.getAll' },
  {
    expected: { body, url: '/admin/roles/role-1' },
    invoke: () => roles.update(requestData<Parameters<typeof roles.update>[0]>({ body, pathParams: { roleId } })),
    method: 'put',
    name: 'roles.update',
  },
  {
    expected: { url: '/public/tenants/tenant-1/script' },
    invoke: () => scripts.get(requestData<Parameters<typeof scripts.get>[0]>({ pathParams: { tenantId } })),
    method: 'get',
    name: 'scripts.get',
  },
  {
    expected: { body, url: '/public/auth/session' },
    invoke: () => sessions.logIn(requestData<Parameters<typeof sessions.logIn>[0]>({ body })),
    method: 'post',
    name: 'sessions.logIn',
  },
  { expected: { url: '/public/auth/session' }, invoke: () => sessions.logOut(), method: 'get', name: 'sessions.logOut' },
  {
    expected: { url: '/public/auth/session/refresh' },
    invoke: () => sessions.refreshAccessToken(),
    method: 'get',
    name: 'sessions.refreshAccessToken',
  },
  {
    expected: { body, url: '/tenants' },
    invoke: () => tenants.create(requestData<Parameters<typeof tenants.create>[0]>({ body })),
    method: 'post',
    name: 'tenants.create',
  },
  {
    expected: { url: '/tenants/tenant-1' },
    invoke: () => tenants.delete(requestData<Parameters<typeof tenants.delete>[0]>({ pathParams: { tenantId } })),
    method: 'delete',
    name: 'tenants.delete',
  },
  {
    expected: { url: '/tenants/tenant-1' },
    invoke: () => tenants.get(requestData<Parameters<typeof tenants.get>[0]>({ pathParams: { tenantId } })),
    method: 'get',
    name: 'tenants.get',
  },
  { expected: { url: '/tenants' }, invoke: () => tenants.getAll(), method: 'get', name: 'tenants.getAll' },
  {
    expected: { body, url: '/tenants/tenant-1' },
    invoke: () => tenants.update(requestData<Parameters<typeof tenants.update>[0]>({ body, pathParams: { tenantId } })),
    method: 'put',
    name: 'tenants.update',
  },
  {
    expected: { body: { targetTenantId }, url: '/tenants/tenant-1/track-events/event-1/copy' },
    invoke: () =>
      trackEvents.copy(
        requestData<Parameters<typeof trackEvents.copy>[0]>({
          body: { targetTenantId },
          pathParams: { tenantId, trackEventId },
        }),
      ),
    method: 'post',
    name: 'trackEvents.copy',
  },
  {
    expected: { body, url: '/tenants/tenant-1/track-events' },
    invoke: () => trackEvents.create(requestData<Parameters<typeof trackEvents.create>[0]>({ body, pathParams: { tenantId } })),
    method: 'post',
    name: 'trackEvents.create',
  },
  {
    expected: { url: '/tenants/tenant-1/track-events/event-1' },
    invoke: () => trackEvents.delete(requestData<Parameters<typeof trackEvents.delete>[0]>({ pathParams: { tenantId, trackEventId } })),
    method: 'delete',
    name: 'trackEvents.delete',
  },
  {
    expected: { url: '/tenants/tenant-1/track-events/event-1' },
    invoke: () => trackEvents.get(requestData<Parameters<typeof trackEvents.get>[0]>({ pathParams: { tenantId, trackEventId } })),
    method: 'get',
    name: 'trackEvents.get',
  },
  {
    expected: { url: '/tenants/tenant-1/track-events/getAllForAudience' },
    invoke: () => trackEvents.getAllForAudience(requestData<Parameters<typeof trackEvents.getAllForAudience>[0]>({ pathParams: { audienceId, tenantId } })),
    method: 'get',
    name: 'trackEvents.getAllForAudience',
  },
  {
    expected: { queryParams, url: '/tenants/tenant-1/track-events' },
    invoke: () => trackEvents.getMany(requestData<Parameters<typeof trackEvents.getMany>[0]>({ pathParams: { tenantId }, queryParams })),
    method: 'get',
    name: 'trackEvents.getMany',
  },
  {
    expected: { body, url: '/tenants/tenant-1/track-events/event-1' },
    invoke: () => trackEvents.update(requestData<Parameters<typeof trackEvents.update>[0]>({ body, pathParams: { tenantId, trackEventId } })),
    method: 'put',
    name: 'trackEvents.update',
  },
  {
    expected: { body, url: '/admin/users' },
    invoke: () => users.create(requestData<Parameters<typeof users.create>[0]>({ body })),
    method: 'post',
    name: 'users.create',
  },
  {
    expected: { url: '/admin/users/user-1' },
    invoke: () => users.delete(requestData<Parameters<typeof users.delete>[0]>({ pathParams: { userId } })),
    method: 'delete',
    name: 'users.delete',
  },
  { expected: { url: '/admin/users/user' }, invoke: () => users.get(), method: 'get', name: 'users.get' },
  { expected: { url: '/admin/users' }, invoke: () => users.getAll(), method: 'get', name: 'users.getAll' },
  {
    expected: { body, url: '/admin/users/user-1' },
    invoke: () => users.update(requestData<Parameters<typeof users.update>[0]>({ body, pathParams: { userId } })),
    method: 'put',
    name: 'users.update',
  },
  {
    expected: { body, url: '/account/update-account' },
    invoke: () => users.updateAccount(requestData<Parameters<typeof users.updateAccount>[0]>({ body })),
    method: 'put',
    name: 'users.updateAccount',
  },
  {
    expected: { body, url: '/account/update-password' },
    invoke: () => users.updatePassword(requestData<Parameters<typeof users.updatePassword>[0]>({ body })),
    method: 'put',
    name: 'users.updatePassword',
  },
];

describe('REST API route adapters', () => {
  beforeEach(() => {
    vi.spyOn(fetchers, 'delete').mockResolvedValue({ ok: false });
    vi.spyOn(fetchers, 'get').mockResolvedValue({ ok: false });
    vi.spyOn(fetchers, 'post').mockResolvedValue({ ok: false });
    vi.spyOn(fetchers, 'put').mockResolvedValue({ ok: false });
  });

  afterEach(() => vi.restoreAllMocks());

  it.each(apiCases)('$name forwards its method and request data', async ({ expected, invoke, method }) => {
    await expect(invoke()).resolves.toEqual({ ok: false });
    expect(vi.mocked(fetchers[method])).toHaveBeenCalledWith(expected);
  });
});
