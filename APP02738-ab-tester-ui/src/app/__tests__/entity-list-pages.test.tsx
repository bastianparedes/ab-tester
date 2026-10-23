// @vitest-environment jsdom

import type { TypeAudienceForMenu } from '@ab-tester/constants/types/audience';
import type { TypeCampaignForMenu } from '@ab-tester/constants/types/campaign';
import type { TypeExecutionGroup, TypeExecutionGroupForMenu } from '@ab-tester/constants/types/executionGroup';
import type { TypeLifecycleHookForMenu } from '@ab-tester/constants/types/lifecycleHooks';
import type { TypeTrackEventForMenu } from '@ab-tester/constants/types/trackEvents';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamicDialog } from '@/app/_common/contexts/Dialog/Component';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { ToastProvider } from '@/app/_common/contexts/ToastEmitter';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage as AudienceList } from '../tenants/[tenantId]/audiences/clientPage';
import { ClientPage as CampaignList } from '../tenants/[tenantId]/campaigns/clientPage';
import { ClientPage as ExecutionGroupList } from '../tenants/[tenantId]/execution-groups/clientPage';
import { ClientPage as LifecycleHookList } from '../tenants/[tenantId]/lifecycle-hooks/clientPage';
import { ClientPage as TrackEventList } from '../tenants/[tenantId]/track-events/clientPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useDialogStore.setState({ data: null, description: null, isOpen: false, resolver: () => {}, title: null });
});

const renderWithProviders = (children: React.ReactNode, permissions: string[] = []) =>
  render(
    <ToastProvider>
      <TranslationProvider language="english">
        <UserProvider user={{ data: null, isLogedIn: false, permissions }}>{children}</UserProvider>
      </TranslationProvider>
    </ToastProvider>,
  );

const successfulResponse = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });
const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');
const tenantId = 12;

describe('audience list client page', () => {
  const audience: TypeAudienceForMenu = { createdAt, id: 9, name: 'Returning customers', updatedAt };

  it('copies referenced track events before creating the audience in the selected tenant', async () => {
    const sourceReadPermission = getStringPermission({ action: 'read', feature: 'audience', tenantId });
    const sourceTrackEventReadPermission = getStringPermission({ action: 'read', feature: 'track-event', tenantId });
    const targetAudiencePermission = getStringPermission({ action: 'create', feature: 'audience', tenantId: 13 });
    const targetTrackEventPermission = getStringPermission({ action: 'create', feature: 'track-event', tenantId: 13 });
    vi.spyOn(apiCaller.audiences, 'getMany').mockImplementation(async () => successfulResponse({ audiences: [audience], count: 1 }));
    const getAudience = vi.spyOn(apiCaller.audiences, 'get').mockResolvedValue(
      successfulResponse({
        ...audience,
        requirements: {
          data: {
            children: [
              { data: { eventCount: 1, quantityOperator: 'atLeast', timeAmount: 30, timeUnit: 'days', trackEventId: 22 }, type: 'any' },
              {
                data: {
                  children: [{ data: { eventCount: 2, quantityOperator: 'moreThan', timeAmount: 7, timeUnit: 'days', trackEventId: 22 }, type: 'any' }],
                  operator: 'or',
                },
                type: 'node',
              },
            ],
            operator: 'and',
          },
          type: 'node',
        },
        tenantId,
      }),
    );
    vi.spyOn(apiCaller.tenants, 'getAll').mockResolvedValue(
      successfulResponse([
        { description: '', domain: 'target.test', id: 13, name: 'Target tenant' },
        { description: '', domain: 'no-events.test', id: 14, name: 'No track-event access' },
      ]),
    );
    const copyAudience = vi.spyOn(apiCaller.audiences, 'copy').mockResolvedValue(successfulResponse({}));

    renderWithProviders(
      <>
        <AudienceList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [sourceReadPermission, sourceTrackEventReadPermission, targetAudiencePermission, targetTrackEventPermission],
    );

    const row = (await screen.findByText('Returning customers')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Copy to tenant Returning customers' }));
    await waitFor(() => expect(getAudience).toHaveBeenCalledWith({ pathParams: { audienceId: audience.id, tenantId } }));

    const tenantSelect = (await screen.findAllByRole('combobox')).find((select) =>
      Array.from((select as HTMLSelectElement).options).some((option) => option.textContent === 'Target tenant'),
    ) as HTMLSelectElement;
    expect(within(tenantSelect).queryByRole('option', { name: 'No track-event access' })).toBeNull();
    fireEvent.change(tenantSelect, { target: { value: '13' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() =>
      expect(copyAudience).toHaveBeenCalledWith({
        body: { targetTenantId: 13 },
        pathParams: { audienceId: audience.id, tenantId },
      }),
    );
  });
});

describe('campaign list client page', () => {
  const campaign: TypeCampaignForMenu & { executionGroup: TypeExecutionGroup | null } = {
    createdAt,
    executionGroup: null,
    executionGroupId: null,
    id: 4,
    name: 'Spring campaign',
    status: 'active',
    tenantId,
    updatedAt,
  };

  it('renders campaigns and sends updated status filters', async () => {
    const getMany = vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [campaign], count: 1 }));
    renderWithProviders(<CampaignList tenantId={tenantId} />);

    expect(await screen.findByText('Spring campaign')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'updatedAt', orderDirection: 'desc', page: 0, quantity: 25, statusList: ['inactive'], textSearch: '' },
      }),
    );
  });

  it('copies a campaign and its audience dependencies to a tenant with the required permissions', async () => {
    vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [campaign], count: 1 }));
    const getCampaign = vi.spyOn(apiCaller.campaigns, 'get').mockResolvedValue(
      successfulResponse({
        ...campaign,
        requirements: {
          data: { children: [{ data: { id: 30 }, type: 'audience' }], operator: 'and' },
          type: 'node',
        },
        triggers: [],
        variations: [],
      }),
    );
    vi.spyOn(apiCaller.audiences, 'get').mockResolvedValue(
      successfulResponse({
        createdAt,
        id: 30,
        name: 'Returning customers',
        requirements: {
          data: {
            children: [{ data: { eventCount: 1, quantityOperator: 'atLeast', timeAmount: 30, timeUnit: 'days', trackEventId: 50 }, type: 'any' }],
            operator: 'and',
          },
          type: 'node',
        },
        tenantId,
        updatedAt,
      }),
    );
    vi.spyOn(apiCaller.tenants, 'getAll').mockResolvedValue(
      successfulResponse([
        { description: '', domain: 'target.test', id: 13, name: 'Target tenant' },
        { description: '', domain: 'audience-only.test', id: 14, name: 'No event access' },
      ]),
    );
    const copyCampaign = vi.spyOn(apiCaller.campaigns, 'copy').mockResolvedValue(successfulResponse({}));

    renderWithProviders(
      <>
        <CampaignList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [
        getStringPermission({ action: 'read', feature: 'campaign', tenantId }),
        getStringPermission({ action: 'read', feature: 'audience', tenantId }),
        getStringPermission({ action: 'read', feature: 'track-event', tenantId }),
        getStringPermission({ action: 'create', feature: 'campaign', tenantId: 13 }),
        getStringPermission({ action: 'create', feature: 'audience', tenantId: 13 }),
        getStringPermission({ action: 'create', feature: 'track-event', tenantId: 13 }),
        getStringPermission({ action: 'create', feature: 'campaign', tenantId: 14 }),
        getStringPermission({ action: 'create', feature: 'audience', tenantId: 14 }),
      ],
    );

    const row = (await screen.findByText('Spring campaign')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Copy to tenant Spring campaign' }));
    await waitFor(() =>
      expect(getCampaign).toHaveBeenCalledWith({
        pathParams: { campaignId: campaign.id, tenantId },
      }),
    );

    const tenantSelect = (await screen.findAllByRole('combobox')).find((select) =>
      Array.from((select as HTMLSelectElement).options).some((option) => option.textContent === 'Target tenant'),
    ) as HTMLSelectElement;
    expect(within(tenantSelect).queryByRole('option', { name: 'No event access' })).toBeNull();
    fireEvent.change(tenantSelect, { target: { value: '13' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() =>
      expect(copyCampaign).toHaveBeenCalledWith({
        body: { targetTenantId: 13 },
        pathParams: { campaignId: campaign.id, tenantId },
      }),
    );
  });

  it('toggles campaign sort direction and applies the selected quantity', async () => {
    const getMany = vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [campaign], count: 80 }));
    const { container } = renderWithProviders(<CampaignList tenantId={tenantId} />);
    await screen.findByText('Spring campaign');
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'asc', page: 0, quantity: 50, statusList: ['active', 'inactive'], textSearch: '' },
      }),
    );

    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'desc', page: 0, quantity: 50, statusList: ['active', 'inactive'], textSearch: '' },
      }),
    );
  });

  it('covers campaign columns, status reactivation and hidden execution-group links', async () => {
    const group = {
      createdAt,
      id: 25,
      name: 'Primary group',
      onlyCampaignsPreviouslyExecuted: true,
      onlyOneCampaignPerPageLoad: true,
      status: 'active' as const,
      tenantId,
      updatedAt,
      waitForEveryCampaignToBeEvaluated: true,
    };
    const linkedCampaign = { ...campaign, executionGroup: group };
    const getMany = vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [linkedCampaign], count: 100 }));
    const { container } = renderWithProviders(<CampaignList tenantId={tenantId} />, [getStringPermission({ action: 'read', feature: 'campaign', tenantId })]);
    expect(await screen.findByText('Spring campaign')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Primary group/ })).toBeNull();

    fireEvent.click(screen.getByRole('columnheader', { name: /ID/ }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'id', orderDirection: 'asc' }) })));
    fireEvent.click(screen.getByRole('columnheader', { name: /ID/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'id', orderDirection: 'desc' }) })),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Status/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'status', orderDirection: 'asc' }) })),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Updated at/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'updatedAt', orderDirection: 'asc' }) })),
    );

    const activeFilter = screen.getByRole('checkbox', { name: 'Active' });
    fireEvent.click(activeFilter);
    fireEvent.click(activeFilter);
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'spring' } });
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryParams: expect.objectContaining({ quantity: 50, statusList: ['inactive', 'active'], textSearch: 'spring' }) }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ page: 1 }) })));
  });

  it('deletes a campaign after confirmation and reloads', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const deleteCampaign = vi.spyOn(apiCaller.campaigns, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [campaign], count: 1 }));
    const deletePermission = getStringPermission({ action: 'delete', feature: 'campaign', tenantId });
    renderWithProviders(
      <>
        <CampaignList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [deletePermission],
    );
    const row = (await screen.findByText('Spring campaign')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(deleteCampaign).toHaveBeenCalledWith({ pathParams: { campaignId: 4, tenantId } }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('returns to the prior campaign page after pagination', async () => {
    const getMany = vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [campaign], count: 30 }));
    renderWithProviders(<CampaignList tenantId={tenantId} />);
    await screen.findByText('Spring campaign');
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'updatedAt', orderDirection: 'desc', page: 1, quantity: 25, statusList: ['active', 'inactive'], textSearch: '' },
      }),
    );
  });

  it('does not call delete when the confirmation is cancelled', async () => {
    const deleteCampaign = vi.spyOn(apiCaller.campaigns, 'delete');
    vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [campaign], count: 1 }));
    renderWithProviders(
      <>
        <CampaignList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'delete', feature: 'campaign', tenantId })],
    );
    const row = (await screen.findByText('Spring campaign')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(deleteCampaign).not.toHaveBeenCalled();
  });

  it('shows the empty state when the campaign query fails', async () => {
    const getMany = vi.spyOn(apiCaller.campaigns, 'getMany').mockResolvedValue({ ok: false });
    renderWithProviders(<CampaignList tenantId={tenantId} />);

    await waitFor(() => expect(getMany).toHaveBeenCalledOnce());
    expect(screen.getByText('No tests found that match the filters')).toBeTruthy();
  });

  it('uses the neutral status style for an unknown campaign status', async () => {
    const unknownCampaign = { ...campaign, status: 'archived' };
    vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [unknownCampaign], count: 1 }));
    renderWithProviders(<CampaignList tenantId={tenantId} />);

    const row = (await screen.findByText('Spring campaign')).closest('tr') as HTMLElement;
    expect(row.querySelector('.bg-gray-100')).not.toBeNull();
  });
});

it('shows clone/edit/group links according to campaign permissions and status', async () => {
  const baseCampaign: TypeCampaignForMenu = { createdAt, executionGroupId: null, id: 4, name: 'Spring campaign', status: 'active', tenantId, updatedAt };
  const group = {
    createdAt,
    id: 25,
    name: 'Primary group',
    onlyCampaignsPreviouslyExecuted: true,
    onlyOneCampaignPerPageLoad: true,
    status: 'active' as const,
    tenantId,
    updatedAt,
    waitForEveryCampaignToBeEvaluated: true,
  };
  const linkedCampaign = { ...baseCampaign, executionGroup: group };
  const inactiveCampaign = { ...baseCampaign, executionGroup: null, id: 5, name: 'Archived campaign', status: 'inactive' as const };
  vi.spyOn(apiCaller.campaigns, 'getMany').mockImplementation(async () => successfulResponse({ campaigns: [linkedCampaign, inactiveCampaign], count: 2 }));
  renderWithProviders(<CampaignList tenantId={tenantId} />, [
    getStringPermission({ action: 'create', feature: 'campaign', tenantId }),
    getStringPermission({ action: 'read', feature: 'campaign', tenantId }),
    getStringPermission({ action: 'read', feature: 'execution-group', tenantId }),
  ]);

  expect(await screen.findByText('Archived campaign')).toBeTruthy();
  const archivedRow = screen.getByText('Archived campaign').closest('tr') as HTMLElement;
  expect(within(archivedRow).getByText('Inactive').className).toContain('bg-yellow-100');
  const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
  expect(hrefs).toContain('/tenants/12/campaigns/undefined?cloneFrom=4');
  expect(hrefs).toContain('/tenants/12/campaigns/4');
  expect(hrefs).toContain('/tenants/12/execution-groups/25');
});

describe('execution group list client page', () => {
  const executionGroup: TypeExecutionGroupForMenu & { campaignsCount: number } = {
    campaignsCount: 3,
    createdAt,
    id: 8,
    name: 'Primary group',
    status: 'active',
    updatedAt,
  };

  it('renders campaign counts and sends the selected sort order', async () => {
    const getMany = vi.spyOn(apiCaller.executionGroups, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, executionGroups: [executionGroup] }));
    renderWithProviders(<ExecutionGroupList tenantId={tenantId} />);

    expect(await screen.findByText('Primary group')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'asc', page: 0, quantity: 25, statusList: ['active', 'inactive'], textSearch: '' },
      }),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Status/ }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'status' }) })));
  });

  it('copies an execution group with its campaigns and dependencies to a permitted tenant', async () => {
    vi.spyOn(apiCaller.executionGroups, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, executionGroups: [executionGroup] }));
    const getGroup = vi.spyOn(apiCaller.executionGroups, 'get').mockResolvedValue(
      successfulResponse({
        campaigns: [{ id: 31 }],
        executionGroup: { ...executionGroup, onlyCampaignsPreviouslyExecuted: false, onlyOneCampaignPerPageLoad: true, waitForEveryCampaignToBeEvaluated: true },
      }),
    );
    const getCampaign = vi.spyOn(apiCaller.campaigns, 'get').mockResolvedValue(
      successfulResponse({
        createdAt,
        executionGroup: null,
        executionGroupId: 8,
        id: 31,
        name: 'Spring campaign',
        requirements: {
          data: { children: [{ data: { id: 40 }, type: 'audience' }], operator: 'and' },
          type: 'node',
        },
        status: 'active',
        tenantId,
        triggers: [],
        updatedAt,
        variations: [],
      }),
    );
    vi.spyOn(apiCaller.audiences, 'get').mockResolvedValue(
      successfulResponse({
        createdAt,
        id: 40,
        name: 'Returning customers',
        requirements: {
          data: {
            children: [{ data: { eventCount: 1, quantityOperator: 'atLeast', timeAmount: 30, timeUnit: 'days', trackEventId: 50 }, type: 'any' }],
            operator: 'and',
          },
          type: 'node',
        },
        tenantId,
        updatedAt,
      }),
    );
    vi.spyOn(apiCaller.tenants, 'getAll').mockResolvedValue(
      successfulResponse([
        { description: '', domain: 'target.test', id: 13, name: 'Target tenant' },
        { description: '', domain: 'no-events.test', id: 14, name: 'No track-event access' },
      ]),
    );
    const copyGroup = vi.spyOn(apiCaller.executionGroups, 'copy').mockResolvedValue(successfulResponse({}));
    renderWithProviders(
      <>
        <ExecutionGroupList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [
        getStringPermission({ action: 'read', feature: 'execution-group', tenantId }),
        getStringPermission({ action: 'read', feature: 'campaign', tenantId }),
        getStringPermission({ action: 'read', feature: 'audience', tenantId }),
        getStringPermission({ action: 'read', feature: 'track-event', tenantId }),
        getStringPermission({ action: 'create', feature: 'execution-group', tenantId: 13 }),
        getStringPermission({ action: 'create', feature: 'campaign', tenantId: 13 }),
        getStringPermission({ action: 'create', feature: 'audience', tenantId: 13 }),
        getStringPermission({ action: 'create', feature: 'track-event', tenantId: 13 }),
        getStringPermission({ action: 'create', feature: 'execution-group', tenantId: 14 }),
        getStringPermission({ action: 'create', feature: 'campaign', tenantId: 14 }),
        getStringPermission({ action: 'create', feature: 'audience', tenantId: 14 }),
      ],
    );

    const row = (await screen.findByText('Primary group')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Copy to tenant Primary group' }));
    await waitFor(() => expect(getGroup).toHaveBeenCalledWith({ pathParams: { executionGroupId: executionGroup.id, tenantId } }));
    expect(getCampaign).toHaveBeenCalledWith({ pathParams: { campaignId: 31, tenantId } });
    const tenantSelect = (await screen.findAllByRole('combobox')).find((select) =>
      Array.from((select as HTMLSelectElement).options).some((option) => option.textContent === 'Target tenant'),
    ) as HTMLSelectElement;
    expect(within(tenantSelect).queryByRole('option', { name: 'No track-event access' })).toBeNull();
    fireEvent.change(tenantSelect, { target: { value: '13' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() =>
      expect(copyGroup).toHaveBeenCalledWith({
        body: { targetTenantId: 13 },
        pathParams: { executionGroupId: executionGroup.id, tenantId },
      }),
    );
  });

  it('covers execution-group sort toggles, filters, pagination and create access', async () => {
    const getMany = vi.spyOn(apiCaller.executionGroups, 'getMany').mockImplementation(async () => successfulResponse({ count: 100, executionGroups: [executionGroup] }));
    const { container } = renderWithProviders(<ExecutionGroupList tenantId={tenantId} />, [getStringPermission({ action: 'create', feature: 'execution-group', tenantId })]);
    expect(await screen.findByText('Primary group')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/tenants/12/execution-groups/undefined');

    fireEvent.click(screen.getByRole('columnheader', { name: /ID/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'id', orderDirection: 'desc' }) })),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'name', orderDirection: 'asc' }) })),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Updated at/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'updatedAt', orderDirection: 'asc' }) })),
    );

    const activeFilter = screen.getByRole('checkbox', { name: 'Active' });
    fireEvent.click(activeFilter);
    fireEvent.click(activeFilter);
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ quantity: 50, statusList: ['inactive', 'active'] }) })),
    );

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ page: 1 }) })));
  });

  it('does not delete an execution group when confirmation is cancelled', async () => {
    const deleteGroup = vi.spyOn(apiCaller.executionGroups, 'delete');
    vi.spyOn(apiCaller.executionGroups, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, executionGroups: [executionGroup] }));
    renderWithProviders(
      <>
        <ExecutionGroupList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'delete', feature: 'execution-group', tenantId })],
    );
    const row = (await screen.findByText('Primary group')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));

    expect(deleteGroup).not.toHaveBeenCalled();
  });

  it('applies execution-group text, status and page-size filters', async () => {
    const getMany = vi.spyOn(apiCaller.executionGroups, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, executionGroups: [executionGroup] }));
    const { container } = renderWithProviders(<ExecutionGroupList tenantId={tenantId} />);
    await screen.findByText('Primary group');
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'primary' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Active' }));
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'id', orderDirection: 'asc', page: 0, quantity: 200, statusList: ['inactive'], textSearch: 'primary' },
      }),
    );
  });

  it('applies status and page-size filters to execution groups', async () => {
    const inactiveGroup = { ...executionGroup, id: 9, name: 'Archived group', status: 'inactive' as const };
    const getMany = vi
      .spyOn(apiCaller.executionGroups, 'getMany')
      .mockImplementation(async () => successfulResponse({ count: 2, executionGroups: [executionGroup, inactiveGroup] }));
    const { container } = renderWithProviders(<ExecutionGroupList tenantId={tenantId} />);
    expect(await screen.findByText('Archived group')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Active' }));
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'id', orderDirection: 'asc', page: 0, quantity: 100, statusList: ['inactive'], textSearch: '' },
      }),
    );
  });

  it('deletes an execution group after confirmation and reloads', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const deleteGroup = vi.spyOn(apiCaller.executionGroups, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.spyOn(apiCaller.executionGroups, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, executionGroups: [executionGroup] }));
    renderWithProviders(
      <>
        <ExecutionGroupList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'delete', feature: 'execution-group', tenantId })],
    );
    const row = (await screen.findByText('Primary group')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(deleteGroup).toHaveBeenCalledWith({ pathParams: { executionGroupId: 8, tenantId } }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('shows the execution-group edit link when update permission exists', async () => {
    vi.spyOn(apiCaller.executionGroups, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, executionGroups: [executionGroup] }));
    renderWithProviders(<ExecutionGroupList tenantId={tenantId} />, [getStringPermission({ action: 'update', feature: 'execution-group', tenantId })]);
    await screen.findByText('Primary group');

    expect(screen.getByRole('link').getAttribute('href')).toBe('/tenants/12/execution-groups/8');
  });

  it('uses the neutral status style for an unknown execution-group status', async () => {
    const unknownGroup = { ...executionGroup, status: 'archived' };
    vi.spyOn(apiCaller.executionGroups, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, executionGroups: [unknownGroup] }));
    renderWithProviders(<ExecutionGroupList tenantId={tenantId} />);

    const row = (await screen.findByText('Primary group')).closest('tr') as HTMLElement;
    expect(row.querySelector('.bg-gray-100')).not.toBeNull();
  });
});

describe('track event list client page', () => {
  const trackEvent: TypeTrackEventForMenu = { createdAt, id: 11, name: 'Checkout', status: 'inactive', updatedAt };

  it('renders events and applies text filters to the request', async () => {
    const getMany = vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, trackEvents: [trackEvent] }));
    const { container } = renderWithProviders(<TrackEventList tenantId={tenantId} />);

    expect(await screen.findByText('Checkout')).toBeTruthy();
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'purchase' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'updatedAt', orderDirection: 'desc', page: 0, quantity: 25, statusList: ['active', 'inactive'], textSearch: 'purchase' },
      }),
    );
  });

  it('removes the active status from the event query', async () => {
    const getMany = vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, trackEvents: [trackEvent] }));
    renderWithProviders(<TrackEventList tenantId={tenantId} />);
    await screen.findByText('Checkout');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'updatedAt', orderDirection: 'desc', page: 0, quantity: 25, statusList: ['inactive'], textSearch: '' },
      }),
    );
  });

  it('applies event status and page-size filters', async () => {
    const activeEvent = { ...trackEvent, id: 12, name: 'Purchase', status: 'active' as const };
    const getMany = vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 2, trackEvents: [trackEvent, activeEvent] }));
    const { container } = renderWithProviders(<TrackEventList tenantId={tenantId} />);
    expect(await screen.findByText('Purchase')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inactive' }));
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'updatedAt', orderDirection: 'desc', page: 0, quantity: 50, statusList: ['active'], textSearch: '' },
      }),
    );
  });

  it('deletes a track event only after confirmation', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const deleteEvent = vi.spyOn(apiCaller.trackEvents, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, trackEvents: [trackEvent] }));
    renderWithProviders(
      <>
        <TrackEventList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'delete', feature: 'track-event', tenantId })],
    );
    const row = (await screen.findByText('Checkout')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith({ pathParams: { tenantId, trackEventId: 11 } }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('copies a track event to a tenant selected from those with create access', async () => {
    const sourceReadPermission = getStringPermission({ action: 'read', feature: 'track-event', tenantId });
    const targetCreatePermission = getStringPermission({ action: 'create', feature: 'track-event', tenantId: 13 });
    vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, trackEvents: [trackEvent] }));
    const getAllTenants = vi.spyOn(apiCaller.tenants, 'getAll').mockResolvedValue(
      successfulResponse([
        { description: '', domain: 'source.test', id: tenantId, name: 'Source tenant' },
        { description: '', domain: 'target.test', id: 13, name: 'Target tenant' },
        { description: '', domain: 'blocked.test', id: 14, name: 'No access tenant' },
      ]),
    );
    const copyEvent = vi.spyOn(apiCaller.trackEvents, 'copy').mockResolvedValue(successfulResponse({}));

    renderWithProviders(
      <>
        <TrackEventList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [sourceReadPermission, targetCreatePermission],
    );

    const row = (await screen.findByText('Checkout')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Copy to tenant Checkout' }));
    await waitFor(() => expect(getAllTenants).toHaveBeenCalledOnce());

    const targetTenantOption = await screen.findByRole('option', { name: 'Target tenant' });
    const tenantSelect = targetTenantOption.closest('select') as HTMLSelectElement;
    expect(within(tenantSelect).queryByRole('option', { name: 'No access tenant' })).toBeNull();
    fireEvent.change(tenantSelect, { target: { value: '13' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() =>
      expect(copyEvent).toHaveBeenCalledWith({
        body: { targetTenantId: 13 },
        pathParams: { tenantId, trackEventId: trackEvent.id },
      }),
    );
  });

  it('sorts track events both ways and deletes a selected row after confirmation', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const activeEvent = { ...trackEvent, id: 12, name: 'Purchase', status: 'active' as const };
    const getMany = vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 2, trackEvents: [trackEvent, activeEvent] }));
    const deleteEvent = vi.spyOn(apiCaller.trackEvents, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    renderWithProviders(
      <>
        <TrackEventList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'read', feature: 'track-event', tenantId }), getStringPermission({ action: 'delete', feature: 'track-event', tenantId })],
    );
    await screen.findByText('Purchase');
    const purchaseRow = screen.getByText('Purchase').closest('tr') as HTMLElement;
    expect(within(purchaseRow).getByText('Active').className).toContain('bg-green-100');
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'asc', page: 0, quantity: 25, statusList: ['active', 'inactive'], textSearch: '' },
      }),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'desc', page: 0, quantity: 25, statusList: ['active', 'inactive'], textSearch: '' },
      }),
    );

    const row = screen.getByText('Checkout').closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Delete Checkout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith({ pathParams: { tenantId, trackEventId: 11 } }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('covers track-event columns, status reactivation, create access and cancelled deletion', async () => {
    const activeEvent = { ...trackEvent, id: 12, name: 'Purchase', status: 'active' as const };
    const getMany = vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 100, trackEvents: [trackEvent, activeEvent] }));
    const deleteEvent = vi.spyOn(apiCaller.trackEvents, 'delete');
    const { container } = renderWithProviders(
      <>
        <TrackEventList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'create', feature: 'track-event', tenantId }), getStringPermission({ action: 'delete', feature: 'track-event', tenantId })],
    );
    expect(await screen.findByText('Purchase')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create new track event' }).getAttribute('href')).toBe('/tenants/12/track-events/undefined');

    fireEvent.click(screen.getByRole('columnheader', { name: /ID/ }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'id', orderDirection: 'asc' }) })));
    fireEvent.click(screen.getByRole('columnheader', { name: /ID/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'id', orderDirection: 'desc' }) })),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Status/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'status', orderDirection: 'asc' }) })),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Updated at/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'updatedAt', orderDirection: 'asc' }) })),
    );

    const activeFilter = screen.getByRole('checkbox', { name: 'Active' });
    fireEvent.click(activeFilter);
    fireEvent.click(activeFilter);
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ quantity: 50, statusList: ['inactive', 'active'] }) })),
    );

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ page: 1 }) })));
    const checkoutRow = screen.getByText('Checkout').closest('tr') as HTMLElement;
    fireEvent.click(within(checkoutRow).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));
    expect(deleteEvent).not.toHaveBeenCalled();
  });

  it('shows clone and edit links when the reader permission is granted', async () => {
    vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, trackEvents: [trackEvent] }));
    renderWithProviders(<TrackEventList tenantId={tenantId} />, [getStringPermission({ action: 'read', feature: 'track-event', tenantId })]);
    await screen.findByText('Checkout');

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/tenants/12/track-events/undefined?cloneFrom=11');
    expect(hrefs).toContain('/tenants/12/track-events/11');
    const eventRow = screen.getByText('Checkout').closest('tr') as HTMLElement;
    expect(within(eventRow).getByText('Inactive').className).toContain('bg-yellow-100');
  });

  it('uses the neutral status style for an unknown track-event status', async () => {
    const unknownTrackEvent = { ...trackEvent, status: 'archived' };
    vi.spyOn(apiCaller.trackEvents, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, trackEvents: [unknownTrackEvent] }));
    renderWithProviders(<TrackEventList tenantId={tenantId} />);

    const row = (await screen.findByText('Checkout')).closest('tr') as HTMLElement;
    expect(row.querySelector('.bg-gray-100')).not.toBeNull();
  });
});

describe('lifecycle hook list client page', () => {
  const lifecycleHook: TypeLifecycleHookForMenu = { createdAt, id: 15, name: 'Initialize script', option: 'scriptStart', status: 'active', updatedAt };

  it('renders hooks and sends their initial query', async () => {
    const getMany = vi.spyOn(apiCaller.lifecycleHooks, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, lifecycleHooks: [lifecycleHook] }));
    renderWithProviders(<LifecycleHookList tenantId={tenantId} />);

    expect(await screen.findByText('Initialize script')).toBeTruthy();
    await waitFor(() =>
      expect(getMany).toHaveBeenCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'updatedAt', orderDirection: 'desc', page: 0, quantity: 25, statusList: ['active', 'inactive'], textSearch: '' },
      }),
    );
  });

  it('applies text/status/quantity filters and toggles sort direction', async () => {
    const getMany = vi.spyOn(apiCaller.lifecycleHooks, 'getMany').mockImplementation(async () => successfulResponse({ count: 0, lifecycleHooks: [] }));
    const { container } = renderWithProviders(<LifecycleHookList tenantId={tenantId} />);

    await waitFor(() => expect(getMany).toHaveBeenCalledOnce());
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'script' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Active' }));
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'updatedAt', orderDirection: 'desc', page: 0, quantity: 50, statusList: ['inactive'], textSearch: 'script' },
      }),
    );

    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'asc', page: 0, quantity: 50, statusList: ['inactive'], textSearch: 'script' },
      }),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'desc', page: 0, quantity: 50, statusList: ['inactive'], textSearch: 'script' },
      }),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'asc', page: 0, quantity: 50, statusList: ['inactive'], textSearch: 'script' },
      }),
    );

    for (const [heading, orderBy] of [
      ['ID', 'id'],
      ['Status', 'status'],
      ['Execution timing', 'option'],
      ['Updated at', 'updatedAt'],
    ]) {
      fireEvent.click(screen.getByRole('columnheader', { name: new RegExp(heading) }));
      await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy }) })));
    }
  });

  it('covers inactive hooks, status toggles, pagination, create access and cancelled deletion', async () => {
    const inactiveHook = { ...lifecycleHook, id: 16, name: 'Paused script', status: 'inactive' as const };
    const getMany = vi
      .spyOn(apiCaller.lifecycleHooks, 'getMany')
      .mockImplementation(async () => successfulResponse({ count: 100, lifecycleHooks: [lifecycleHook, inactiveHook] }));
    const deleteHook = vi.spyOn(apiCaller.lifecycleHooks, 'delete');
    const { container } = renderWithProviders(
      <>
        <LifecycleHookList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'create', feature: 'tenant', tenantId }), getStringPermission({ action: 'delete', feature: 'tenant', tenantId })],
    );
    expect(await screen.findByText('Paused script')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/tenants/12/lifecycle-hooks/undefined');
    const inactiveRow = screen.getByText('Paused script').closest('tr') as HTMLElement;
    expect(within(inactiveRow).getByText('Inactive').className).toContain('bg-yellow-100');

    const activeFilter = screen.getByRole('checkbox', { name: 'Active' });
    fireEvent.click(activeFilter);
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ statusList: ['inactive'] }) })));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ statusList: ['inactive', 'active'] }) })));
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ quantity: 50, statusList: ['inactive', 'active'] }) })),
    );

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ page: 1 }) })));

    fireEvent.click(screen.getByRole('button', { name: 'Delete Initialize script' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));
    expect(deleteHook).not.toHaveBeenCalled();
  });

  it('copies a lifecycle hook to a tenant with create access', async () => {
    const readTenant = getStringPermission({ action: 'read', feature: 'tenant', tenantId });
    vi.spyOn(apiCaller.lifecycleHooks, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, lifecycleHooks: [lifecycleHook] }));
    vi.spyOn(apiCaller.tenants, 'getAll').mockResolvedValue(
      successfulResponse([
        { description: '', domain: 'source.test', id: tenantId, name: 'Source tenant' },
        { description: '', domain: 'target.test', id: 13, name: 'Target tenant' },
        { description: '', domain: 'blocked.test', id: 14, name: 'No access tenant' },
      ]),
    );
    const copyHook = vi.spyOn(apiCaller.lifecycleHooks, 'copy').mockResolvedValue(successfulResponse({}));

    renderWithProviders(
      <>
        <LifecycleHookList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [readTenant, getStringPermission({ action: 'create', feature: 'tenant', tenantId: 13 })],
    );

    const row = (await screen.findByText('Initialize script')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Copy to tenant Initialize script' }));
    await screen.findByText('Copy lifecycle hook to another tenant');

    const tenantSelect = (await screen.findAllByRole('combobox')).find((select) =>
      Array.from((select as HTMLSelectElement).options).some((option) => option.textContent === 'Target tenant'),
    ) as HTMLSelectElement;
    expect(within(tenantSelect).getByRole('option', { name: 'Target tenant' })).toBeTruthy();
    expect(within(tenantSelect).queryByRole('option', { name: 'No access tenant' })).toBeNull();
    fireEvent.change(tenantSelect, { target: { value: '13' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() =>
      expect(copyHook).toHaveBeenCalledWith({
        body: { targetTenantId: 13 },
        pathParams: { lifecycleHookId: lifecycleHook.id, tenantId },
      }),
    );
  });

  it('deletes a lifecycle hook after confirmation and reloads the page', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const deleteHook = vi.spyOn(apiCaller.lifecycleHooks, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    const readTenant = getStringPermission({ action: 'read', feature: 'tenant', tenantId });
    const deleteTenant = getStringPermission({ action: 'delete', feature: 'tenant', tenantId });
    const getMany = vi.spyOn(apiCaller.lifecycleHooks, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, lifecycleHooks: [lifecycleHook] }));
    renderWithProviders(
      <>
        <LifecycleHookList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [readTenant, deleteTenant],
    );
    await waitFor(() => expect(getMany).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: 'Delete Initialize script' }));
    expect(screen.getByText('Delete lifecycle hook (id: 15) "Initialize script"')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(deleteHook).toHaveBeenCalledWith({ pathParams: { lifecycleHookId: 15, tenantId } }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('shows the empty state when the group query fails', async () => {
    const getMany = vi.spyOn(apiCaller.executionGroups, 'getMany').mockResolvedValue({ ok: false });
    renderWithProviders(<ExecutionGroupList tenantId={tenantId} />);

    await waitFor(() => expect(getMany).toHaveBeenCalledOnce());
    expect(screen.getByText('No tests found that match the filters')).toBeTruthy();
  });

  it('shows the empty state when the event query fails', async () => {
    const getMany = vi.spyOn(apiCaller.trackEvents, 'getMany').mockResolvedValue({ ok: false });
    renderWithProviders(<TrackEventList tenantId={tenantId} />);

    await waitFor(() => expect(getMany).toHaveBeenCalledOnce());
    expect(screen.getByText('No track events found that match the filters')).toBeTruthy();
  });

  it('shows the empty state when the hook query fails', async () => {
    const getMany = vi.spyOn(apiCaller.lifecycleHooks, 'getMany').mockResolvedValue({ ok: false });
    renderWithProviders(<LifecycleHookList tenantId={tenantId} />);

    await waitFor(() => expect(getMany).toHaveBeenCalledOnce());
    expect(screen.getByText('No lifecycle hooks found that match the filters')).toBeTruthy();
  });

  it('uses the neutral status style for an unknown lifecycle-hook status', async () => {
    const unknownHook = { createdAt, id: 17, name: 'Unknown status hook', option: 'scriptStart', status: 'archived', updatedAt };
    vi.spyOn(apiCaller.lifecycleHooks, 'getMany').mockImplementation(async () => successfulResponse({ count: 1, lifecycleHooks: [unknownHook] }));
    renderWithProviders(<LifecycleHookList tenantId={tenantId} />);

    const row = (await screen.findByText('Unknown status hook')).closest('tr') as HTMLElement;
    expect(row.querySelector('.bg-gray-100')).not.toBeNull();
  });
});
