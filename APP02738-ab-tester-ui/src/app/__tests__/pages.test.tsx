import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiCaller } from '@/libs/restClient';
import AdminRolesPage from '../admin/roles/page';
import AdminUsersPage from '../admin/users/page';
import AudienceDetailPage from '../tenants/[tenantId]/audiences/[audienceId]/page';
import AudienceListPage from '../tenants/[tenantId]/audiences/page';
import AudienceCreatePage from '../tenants/[tenantId]/audiences/undefined/page';
import CampaignDetailPage from '../tenants/[tenantId]/campaigns/[campaignId]/page';
import CampaignListPage from '../tenants/[tenantId]/campaigns/page';
import CampaignCreatePage from '../tenants/[tenantId]/campaigns/undefined/page';
import ExecutionGroupDetailPage from '../tenants/[tenantId]/execution-groups/[executionGroupId]/page';
import ExecutionGroupsPage from '../tenants/[tenantId]/execution-groups/page';
import ExecutionGroupCreatePage from '../tenants/[tenantId]/execution-groups/undefined/page';
import LifecycleHookDetailPage from '../tenants/[tenantId]/lifecycle-hooks/[lifecycleHookId]/page';
import LifecycleHooksPage from '../tenants/[tenantId]/lifecycle-hooks/page';
import LifecycleHookCreatePage from '../tenants/[tenantId]/lifecycle-hooks/undefined/page';
import ScriptPage from '../tenants/[tenantId]/script/page';
import TrackEventDetailPage from '../tenants/[tenantId]/track-events/[trackEventId]/page';
import TrackEventsPage from '../tenants/[tenantId]/track-events/page';
import TrackEventCreatePage from '../tenants/[tenantId]/track-events/undefined/page';
import TenantsPage from '../tenants/page';

afterEach(() => vi.restoreAllMocks());

type SuccessfulResponse<T> = { ok: true; json: () => Promise<T>; text: () => Promise<string> } & Response;
type NavigationResult = ReactElement<{
  breadcrumb?: { name: string; path?: string }[];
  children: ReactElement<Record<string, unknown>>;
  tenant?: unknown;
}>;

const successfulResponse = <T,>(data: T, text = '') => ({ json: async () => data, ok: true as const, text: async () => text }) as unknown as SuccessfulResponse<T>;
const tenant = { description: 'Workspace', domain: 'example.test', id: 12, name: 'Acme' };

describe('server route pages', () => {
  it('loads the tenant before rendering the audience list', async () => {
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));

    const result = (await AudienceListPage({ params: Promise.resolve({ tenantId: '12' }) })) as unknown as NavigationResult;

    expect(getTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(result.props.tenant).toEqual(tenant);
    expect(result.props.children.props).toMatchObject({ tenantId: 12 });
  });

  it('loads audience detail and its track events', async () => {
    const audience = { id: 4, name: 'Visitors' };
    const trackEvents = [{ id: 8, name: 'Checkout' }];
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getAudience = vi.spyOn(apiCaller.audiences, 'get').mockResolvedValue(successfulResponse(audience));
    const getTrackEvents = vi.spyOn(apiCaller.trackEvents, 'getAllForAudience').mockResolvedValue(successfulResponse({ trackEvents }));

    const result = (await AudienceDetailPage({ params: Promise.resolve({ audienceId: '4', tenantId: '12' }) })) as unknown as NavigationResult;

    expect(getTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(getAudience).toHaveBeenCalledWith({ pathParams: { audienceId: 4, tenantId: 12 } });
    expect(getTrackEvents).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(result.props.children.props).toMatchObject({ initialAudience: audience, tenantId: 12, trackEvents });
  });

  it('loads campaign details and audiences for its editor', async () => {
    const campaign = { id: 5, name: 'Spring test' };
    const audiences = [{ id: 4, name: 'Visitors' }];
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getCampaign = vi.spyOn(apiCaller.campaigns, 'get').mockResolvedValue(successfulResponse(campaign));
    const getAudiences = vi.spyOn(apiCaller.audiences, 'getAllForCampaign').mockResolvedValue(successfulResponse({ audiences }));

    const result = (await CampaignDetailPage({ params: Promise.resolve({ campaignId: '5', tenantId: '12' }) })) as unknown as NavigationResult;

    expect(getTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(getCampaign).toHaveBeenCalledWith({ pathParams: { campaignId: 5, tenantId: 12 } });
    expect(getAudiences).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(result.props.children.props).toMatchObject({ audiences, campaignId: 5, initialCampaign: campaign, tenantId: 12 });
  });

  it('loads both user and role data for the admin user page', async () => {
    const users = [{ email: 'ada@example.test', id: 1, name: 'Ada', roles: [] }];
    const roles = [{ description: 'Admin role', id: 2, name: 'Admin', permissions: [] }];
    const getUsers = vi.spyOn(apiCaller.users, 'getAll').mockResolvedValue(successfulResponse(users));
    const getRoles = vi.spyOn(apiCaller.roles, 'getAll').mockResolvedValue(successfulResponse(roles));

    const result = (await AdminUsersPage()) as unknown as NavigationResult;

    expect(getUsers).toHaveBeenCalledOnce();
    expect(getRoles).toHaveBeenCalledOnce();
    expect(result.props.children.props).toMatchObject({ initialUsers: users, roles });
  });

  it('loads all tenants for the tenant landing page', async () => {
    const tenants = [tenant];
    const getTenants = vi.spyOn(apiCaller.tenants, 'getAll').mockResolvedValue(successfulResponse(tenants));

    const result = (await TenantsPage()) as unknown as NavigationResult;

    expect(getTenants).toHaveBeenCalledOnce();
    expect(result.props.children.props).toMatchObject({ initialTenants: tenants });
  });

  it('loads tenants and roles for the role administration page', async () => {
    const tenants = [tenant];
    const roles = [{ description: 'Admin role', id: 2, name: 'Admin', permissions: [] }];
    const getTenants = vi.spyOn(apiCaller.tenants, 'getAll').mockResolvedValue(successfulResponse(tenants));
    const getRoles = vi.spyOn(apiCaller.roles, 'getAll').mockResolvedValue(successfulResponse(roles));

    const result = (await AdminRolesPage()) as unknown as NavigationResult;

    expect(getTenants).toHaveBeenCalledOnce();
    expect(getRoles).toHaveBeenCalledOnce();
    expect(result.props.children.props).toMatchObject({ initialRoles: roles, tenants });
  });

  it.each([
    ['Campaigns', () => CampaignListPage({ params: Promise.resolve({ tenantId: '12' }) })],
    ['Execution Groups', () => ExecutionGroupsPage({ params: Promise.resolve({ tenantId: '12' }) })],
    ['Lifecycle hooks', () => LifecycleHooksPage({ params: Promise.resolve({ tenantId: '12' }) })],
    ['Track events', () => TrackEventsPage({ params: Promise.resolve({ tenantId: '12' }) })],
  ])('loads a tenant for the %s route', async (_name, loadPage) => {
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));

    const result = (await loadPage()) as unknown as NavigationResult;

    expect(getTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(result.props.children.props).toMatchObject({ tenantId: 12 });
    expect(result.props.breadcrumb?.at(-1)?.name).toBe(_name);
  });

  it('loads an execution group and its campaigns', async () => {
    const executionGroup = { id: 6, name: 'Primary group' };
    const initialCampaigns = [{ id: 5, name: 'Spring test' }];
    const allCampaigns = [{ id: 9, name: 'Control' }];
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getExecutionGroup = vi.spyOn(apiCaller.executionGroups, 'get').mockResolvedValue(successfulResponse({ campaigns: initialCampaigns, executionGroup }));
    const getCampaigns = vi.spyOn(apiCaller.campaigns, 'getAllForExecutionGroup').mockResolvedValue(successfulResponse({ campaigns: allCampaigns }));

    const result = (await ExecutionGroupDetailPage({ params: Promise.resolve({ executionGroupId: '6', tenantId: '12' }) })) as unknown as NavigationResult;

    expect(getTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(getExecutionGroup).toHaveBeenCalledWith({ pathParams: { executionGroupId: 6, tenantId: 12 } });
    expect(getCampaigns).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(result.props.children.props).toMatchObject({ allCampaigns, executionGroupId: 6, initialCampaigns, initialExecutionGroup: executionGroup, tenantId: 12 });
  });

  it('loads track event details for the editor', async () => {
    const trackEvent = { id: 8, name: 'Checkout' };
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getTrackEvent = vi.spyOn(apiCaller.trackEvents, 'get').mockResolvedValue(successfulResponse({ trackEvent }));

    const result = (await TrackEventDetailPage({ params: Promise.resolve({ tenantId: '12', trackEventId: '8' }) })) as unknown as NavigationResult;

    expect(getTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(getTrackEvent).toHaveBeenCalledWith({ pathParams: { tenantId: 12, trackEventId: 8 } });
    expect(result.props.children.props).toMatchObject({ initialTrackEvent: trackEvent, tenantId: 12, trackEventId: 8 });
  });

  it('normalizes lifecycle hook properties for its editor', async () => {
    const lifecycleHook = { id: 3, javascript: 'return true;', name: 'Initialize', option: 'scriptStart', status: 'active', tenantId: 12 };
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getHook = vi.spyOn(apiCaller.lifecycleHooks, 'get').mockResolvedValue(successfulResponse({ lifecycleHook }));

    const result = (await LifecycleHookDetailPage({ params: Promise.resolve({ lifecycleHookId: '3', tenantId: '12' }) })) as unknown as NavigationResult;

    expect(getHook).toHaveBeenCalledWith({ pathParams: { lifecycleHookId: 3, tenantId: 12 } });
    expect(result.props.children.props).toMatchObject({
      initialLifecycleHook: { id: 3, javascript: 'return true;', name: 'Initialize', status: 'active', tenantId: 12, trigger: 'scriptStart' },
      tenantId: 12,
    });
  });

  it('loads tenant script text and constructs its public URL', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getScript = vi.spyOn(apiCaller.scripts, 'get').mockResolvedValue(successfulResponse('script', 'window.test = true;'));

    const result = (await ScriptPage({ params: Promise.resolve({ tenantId: '12' }) })) as unknown as NavigationResult;

    expect(getScript).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(result.props.children.props).toMatchObject({ script: 'window.test = true;' });
    expect(result.props.children.props.url).toContain('/public/tenants/12/script');
  });

  it('creates an audience draft with a root requirement node', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const trackEvents = [{ id: 8, name: 'Checkout' }];
    vi.spyOn(apiCaller.trackEvents, 'getAllForAudience').mockResolvedValue(successfulResponse({ trackEvents }));

    const result = (await AudienceCreatePage({ params: Promise.resolve({ tenantId: '12' }), searchParams: Promise.resolve({}) })) as unknown as NavigationResult;

    expect(result.props.children.props).toMatchObject({
      initialAudience: { id: undefined, name: 'New Audience Name', requirements: { data: { children: [], operator: 'and' }, type: 'node' }, tenantId: 12 },
      tenantId: 12,
      trackEvents,
    });
  });

  it('clones an audience while clearing its identifier', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const sourceAudience = { id: 8, name: 'Returning visitors' };
    const getAudience = vi.spyOn(apiCaller.audiences, 'get').mockResolvedValue(successfulResponse(sourceAudience));
    vi.spyOn(apiCaller.trackEvents, 'getAllForAudience').mockResolvedValue(successfulResponse({ trackEvents: [] }));

    const result = (await AudienceCreatePage({
      params: Promise.resolve({ tenantId: '12' }),
      searchParams: Promise.resolve({ cloneFrom: '8' }),
    })) as unknown as NavigationResult;

    expect(getAudience).toHaveBeenCalledWith({ pathParams: { audienceId: 8, tenantId: 12 } });
    expect(result.props.children.props.initialAudience).toMatchObject({ id: undefined, name: 'Returning visitors' });
  });

  it('creates a campaign draft with active status and empty collections', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    vi.spyOn(apiCaller.audiences, 'getAllForCampaign').mockResolvedValue(successfulResponse({ audiences: [] }));

    const result = (await CampaignCreatePage({ params: Promise.resolve({ tenantId: '12' }), searchParams: Promise.resolve({}) })) as unknown as NavigationResult;

    expect(result.props.children.props).toMatchObject({
      campaignId: undefined,
      initialCampaign: { executionGroupId: null, id: undefined, name: 'New Campaign Name', status: 'active', tenantId: 12, triggers: [], variations: [] },
      tenantId: 12,
    });
  });

  it('clones a campaign while clearing its identifier', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const sourceCampaign = {
      executionGroupId: null,
      id: 5,
      name: 'Spring test',
      requirements: { data: { children: [], operator: 'and' }, type: 'node' },
      status: 'active',
      tenantId: 12,
      triggers: [],
      variations: [],
    };
    const getCampaign = vi.spyOn(apiCaller.campaigns, 'get').mockResolvedValue(successfulResponse(sourceCampaign));
    vi.spyOn(apiCaller.audiences, 'getAllForCampaign').mockResolvedValue(successfulResponse({ audiences: [] }));

    const result = (await CampaignCreatePage({
      params: Promise.resolve({ tenantId: '12' }),
      searchParams: Promise.resolve({ cloneFrom: '5' }),
    })) as unknown as NavigationResult;

    expect(getCampaign).toHaveBeenCalledWith({ pathParams: { campaignId: 5, tenantId: 12 } });
    expect(result.props.children.props.initialCampaign).toMatchObject({ ...sourceCampaign, id: undefined });
  });

  it('falls back to a fresh campaign when its clone source is unavailable', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getCampaign = vi.spyOn(apiCaller.campaigns, 'get').mockResolvedValue({ ok: false });
    vi.spyOn(apiCaller.audiences, 'getAllForCampaign').mockResolvedValue(successfulResponse({ audiences: [] }));

    const result = (await CampaignCreatePage({
      params: Promise.resolve({ tenantId: '12' }),
      searchParams: Promise.resolve({ cloneFrom: '5' }),
    })) as unknown as NavigationResult;

    expect(getCampaign).toHaveBeenCalledOnce();
    expect(result.props.children.props.initialCampaign).toMatchObject({ id: undefined, name: 'New Campaign Name', status: 'active' });
  });

  it('redirects campaign creation when tenant or audience data cannot be loaded', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue({ ok: false });
    await expect(CampaignCreatePage({ params: Promise.resolve({ tenantId: '12' }), searchParams: Promise.resolve({}) })).rejects.toBeTruthy();

    vi.restoreAllMocks();
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    vi.spyOn(apiCaller.audiences, 'getAllForCampaign').mockResolvedValue({ ok: false });
    await expect(CampaignCreatePage({ params: Promise.resolve({ tenantId: '12' }), searchParams: Promise.resolve({}) })).rejects.toBeTruthy();
  });

  it('creates a new track event with its default script and status', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));

    const result = (await TrackEventCreatePage({ params: Promise.resolve({ tenantId: '12' }), searchParams: Promise.resolve({}) })) as unknown as NavigationResult;

    expect(result.props.children.props.initialTrackEvent).toMatchObject({
      id: undefined,
      multipleTimes: false,
      name: 'New Track Event Name',
      status: 'active',
      tenantId: 12,
    });
    expect((result.props.children.props.initialTrackEvent as { javascript: string }).javascript).toContain('window.addEventListener');
  });

  it('clones a track event while clearing its original id', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const sourceTrackEvent = { javascript: 'return 7;', id: 8, multipleTimes: true, name: 'Checkout', status: 'inactive', tenantId: 12 };
    const getTrackEvent = vi.spyOn(apiCaller.trackEvents, 'get').mockResolvedValue(successfulResponse({ trackEvent: sourceTrackEvent }));

    const result = (await TrackEventCreatePage({
      params: Promise.resolve({ tenantId: '12' }),
      searchParams: Promise.resolve({ cloneFrom: '8' }),
    })) as unknown as NavigationResult;

    expect(getTrackEvent).toHaveBeenCalledWith({ pathParams: { tenantId: 12, trackEventId: 8 } });
    expect(result.props.children.props.initialTrackEvent).toMatchObject({ ...sourceTrackEvent, id: undefined });
  });

  it('falls back to a new track event when its clone source is unavailable', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getTrackEvent = vi.spyOn(apiCaller.trackEvents, 'get').mockResolvedValue({ ok: false });

    const result = (await TrackEventCreatePage({
      params: Promise.resolve({ tenantId: '12' }),
      searchParams: Promise.resolve({ cloneFrom: '8' }),
    })) as unknown as NavigationResult;

    expect(getTrackEvent).toHaveBeenCalledOnce();
    expect(result.props.children.props.initialTrackEvent).toMatchObject({ id: undefined, name: 'New Track Event Name', status: 'active' });
  });

  it('creates an inactive lifecycle hook with its default trigger', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));

    const result = (await LifecycleHookCreatePage({ params: Promise.resolve({ tenantId: '12' }), searchParams: Promise.resolve({}) })) as unknown as NavigationResult;

    expect(result.props.children.props.initialLifecycleHook).toMatchObject({ name: '', status: 'inactive', tenantId: 12, trigger: 'scriptStart' });
  });

  it('clones lifecycle hook code and trigger into a new hook', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const sourceHook = { id: 6, javascript: 'async () => true', name: 'After campaign', option: 'campaignEnd', status: 'active', tenantId: 12 };
    const getHook = vi.spyOn(apiCaller.lifecycleHooks, 'get').mockResolvedValue(successfulResponse({ lifecycleHook: sourceHook }));

    const result = (await LifecycleHookCreatePage({
      params: Promise.resolve({ tenantId: '12' }),
      searchParams: Promise.resolve({ cloneFrom: '6' }),
    })) as unknown as NavigationResult;

    expect(getHook).toHaveBeenCalledWith({ pathParams: { lifecycleHookId: 6, tenantId: 12 } });
    expect(result.props.children.props.initialLifecycleHook).toEqual({
      javascript: sourceHook.javascript,
      name: sourceHook.name,
      status: sourceHook.status,
      tenantId: 12,
      trigger: sourceHook.option,
    });
  });

  it('redirects when a lifecycle hook clone id is invalid', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));

    await expect(
      LifecycleHookCreatePage({
        params: Promise.resolve({ tenantId: '12' }),
        searchParams: Promise.resolve({ cloneFrom: '0' }),
      }),
    ).rejects.toBeTruthy();
  });

  it('creates an execution group with its default campaign rules', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const campaigns = [{ id: 5, name: 'Spring test' }];
    const getCampaigns = vi.spyOn(apiCaller.campaigns, 'getAllForExecutionGroup').mockResolvedValue(successfulResponse({ campaigns }));

    const result = (await ExecutionGroupCreatePage({ params: Promise.resolve({ tenantId: '12' }) })) as unknown as NavigationResult;

    expect(getCampaigns).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(result.props.children.props).toMatchObject({
      allCampaigns: campaigns,
      executionGroupId: undefined,
      initialCampaigns: [],
      initialExecutionGroup: {
        id: undefined,
        name: 'New execution group name',
        onlyCampaignsPreviouslyExecuted: true,
        onlyOneCampaignPerPageLoad: true,
        status: 'inactive',
        tenantId: 12,
        waitForEveryCampaignToBeEvaluated: true,
      },
    });
  });

  it('redirects to the track-event list when an audience has no tracking events', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    vi.spyOn(apiCaller.audiences, 'get').mockResolvedValue(successfulResponse({ id: 4, name: 'Visitors' }));
    vi.spyOn(apiCaller.trackEvents, 'getAllForAudience').mockResolvedValue(successfulResponse({ trackEvents: [] }));

    await expect(AudienceDetailPage({ params: Promise.resolve({ audienceId: '4', tenantId: '12' }) })).rejects.toBeTruthy();
  });

  it('redirects when a campaign cannot be loaded', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    vi.spyOn(apiCaller.campaigns, 'get').mockResolvedValue({ ok: false });

    await expect(CampaignDetailPage({ params: Promise.resolve({ campaignId: '5', tenantId: '12' }) })).rejects.toBeTruthy();
  });

  it('redirects when campaigns for an execution group cannot be loaded', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    vi.spyOn(apiCaller.executionGroups, 'get').mockResolvedValue(successfulResponse({ campaigns: [], executionGroup: { id: 6, name: 'Primary group' } }));
    vi.spyOn(apiCaller.campaigns, 'getAllForExecutionGroup').mockResolvedValue({ ok: false });

    await expect(ExecutionGroupDetailPage({ params: Promise.resolve({ executionGroupId: '6', tenantId: '12' }) })).rejects.toBeTruthy();
  });

  it('redirects when a track event cannot be loaded', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    vi.spyOn(apiCaller.trackEvents, 'get').mockResolvedValue({ ok: false });

    await expect(TrackEventDetailPage({ params: Promise.resolve({ tenantId: '12', trackEventId: '8' }) })).rejects.toBeTruthy();
  });

  it.each(['tenant', 'audience', 'track events'] as const)('redirects audience detail when %s data fails', async (failedResource) => {
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getAudience = vi.spyOn(apiCaller.audiences, 'get').mockResolvedValue(successfulResponse({ id: 4, name: 'Visitors' }));
    const getTrackEvents = vi.spyOn(apiCaller.trackEvents, 'getAllForAudience').mockResolvedValue(successfulResponse({ trackEvents: [{ id: 8, name: 'Checkout' }] }));
    if (failedResource === 'tenant') getTenant.mockResolvedValue({ ok: false });
    if (failedResource === 'audience') getAudience.mockResolvedValue({ ok: false });
    if (failedResource === 'track events') getTrackEvents.mockResolvedValue({ ok: false });

    await expect(AudienceDetailPage({ params: Promise.resolve({ audienceId: '4', tenantId: '12' }) })).rejects.toBeTruthy();
  });

  it('uses a fresh audience when its clone source cannot be loaded', async () => {
    vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    vi.spyOn(apiCaller.audiences, 'get').mockResolvedValue({ ok: false });
    vi.spyOn(apiCaller.trackEvents, 'getAllForAudience').mockResolvedValue(successfulResponse({ trackEvents: [] }));

    const result = (await AudienceCreatePage({
      params: Promise.resolve({ tenantId: '12' }),
      searchParams: Promise.resolve({ cloneFrom: '8' }),
    })) as unknown as NavigationResult;

    expect(result.props.children.props.initialAudience).toMatchObject({ id: undefined, name: 'New Audience Name' });
  });

  it.each(['tenant', 'track events'] as const)('redirects audience creation when %s data fails', async (failedResource) => {
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getTrackEvents = vi.spyOn(apiCaller.trackEvents, 'getAllForAudience').mockResolvedValue(successfulResponse({ trackEvents: [] }));
    if (failedResource === 'tenant') getTenant.mockResolvedValue({ ok: false });
    if (failedResource === 'track events') getTrackEvents.mockResolvedValue({ ok: false });

    await expect(AudienceCreatePage({ params: Promise.resolve({ tenantId: '12' }), searchParams: Promise.resolve({}) })).rejects.toBeTruthy();
  });

  it.each(['tenant', 'lifecycle hook'] as const)('redirects lifecycle detail when %s data fails', async (failedResource) => {
    const lifecycleHook = { id: 3, javascript: 'async () => true', name: 'Initialize', option: 'scriptStart', status: 'active', tenantId: 12 };
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getHook = vi.spyOn(apiCaller.lifecycleHooks, 'get').mockResolvedValue(successfulResponse({ lifecycleHook }));
    if (failedResource === 'tenant') getTenant.mockResolvedValue({ ok: false });
    if (failedResource === 'lifecycle hook') getHook.mockResolvedValue({ ok: false });

    await expect(LifecycleHookDetailPage({ params: Promise.resolve({ lifecycleHookId: '3', tenantId: '12' }) })).rejects.toBeTruthy();
  });

  it('redirects lifecycle detail when its tenant id is not an integer', async () => {
    await expect(LifecycleHookDetailPage({ params: Promise.resolve({ lifecycleHookId: '3', tenantId: 'not-a-number' }) })).rejects.toBeTruthy();
  });

  it.each(['tenant', 'execution group'] as const)('redirects execution-group detail when %s data fails', async (failedResource) => {
    const getTenant = vi.spyOn(apiCaller.tenants, 'get').mockResolvedValue(successfulResponse(tenant));
    const getExecutionGroup = vi
      .spyOn(apiCaller.executionGroups, 'get')
      .mockResolvedValue(successfulResponse({ campaigns: [], executionGroup: { id: 6, name: 'Primary group' } }));
    if (failedResource === 'tenant') getTenant.mockResolvedValue({ ok: false });
    if (failedResource === 'execution group') getExecutionGroup.mockResolvedValue({ ok: false });

    await expect(ExecutionGroupDetailPage({ params: Promise.resolve({ executionGroupId: '6', tenantId: '12' }) })).rejects.toBeTruthy();
  });
});
