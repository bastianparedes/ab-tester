// @vitest-environment jsdom

import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import type { TypeExecutionGroupWithOptionalId } from '@ab-tester/constants/types/executionGroup';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage as CampaignEditor } from '../tenants/[tenantId]/campaigns/[campaignId]/clientPage';
import { ClientPage as ExecutionGroupEditor } from '../tenants/[tenantId]/execution-groups/[executionGroupId]/clientPage';

const socketHandlers = vi.hoisted(() => new Map<string, (payload: unknown) => void>());
const socketEmit = vi.hoisted(() => vi.fn());
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    disconnect: vi.fn(),
    emit: socketEmit,
    on: vi.fn((event: string, handler: (payload: unknown) => void) => socketHandlers.set(event, handler)),
  })),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  socketHandlers.clear();
  socketEmit.mockClear();
});

const renderWithPermissions = (children: React.ReactNode, permissions: string[]) =>
  render(
    <TranslationProvider language="english">
      <UserProvider user={{ data: null, isLogedIn: false, permissions }}>{children}</UserProvider>
    </TranslationProvider>,
  );

const campaign: TypeCampaignWithOptionalId = {
  executionGroupId: null,
  name: 'Draft campaign',
  requirements: { data: { children: [], operator: 'and' }, type: 'node' },
  status: 'active',
  tenantId: 12,
  triggers: [],
  variations: [{ css: '', html: '', id: 1, javascript: '', name: 'Control', traffic: 90 }],
};

const executionGroup: TypeExecutionGroupWithOptionalId = {
  name: 'Primary group',
  onlyCampaignsPreviouslyExecuted: true,
  onlyOneCampaignPerPageLoad: true,
  status: 'inactive',
  tenantId: 12,
  waitForEveryCampaignToBeEvaluated: true,
};

const campaigns = [
  { executionGroupId: null, id: 1, name: 'Alpha', status: 'active' as const, tenantId: 12 },
  { executionGroupId: null, id: 2, name: 'Beta', status: 'inactive' as const, tenantId: 12 },
];

describe('campaign editor', () => {
  it('enables saving after a new variation redistributes traffic to 100%', () => {
    renderWithPermissions(<CampaignEditor audiences={[]} campaignId={undefined} initialCampaign={campaign} tenantId={12} />, [
      getStringPermission({ action: 'create', feature: 'campaign', tenantId: 12 }),
    ]);

    const saveButton = screen.getByRole('button', { name: 'Save Campaign' }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'New variation' }));

    expect(saveButton.disabled).toBe(false);
    expect(screen.getAllByRole('spinbutton').map((input) => (input as HTMLInputElement).value)).toEqual(['50', '50']);
  });

  it('creates a campaign with traffic totaling 100%', async () => {
    const create = vi.spyOn(apiCaller.campaigns, 'create').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    renderWithPermissions(<CampaignEditor audiences={[]} campaignId={undefined} initialCampaign={campaign} tenantId={12} />, [
      getStringPermission({ action: 'create', feature: 'campaign', tenantId: 12 }),
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'New variation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Campaign' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          name: 'Draft campaign',
          variations: [expect.objectContaining({ id: 1, traffic: 50 }), expect.objectContaining({ id: 2, traffic: 50 })],
        }),
        pathParams: { tenantId: 12 },
      }),
    );
    await waitFor(() => expect(location.href).toBe('/tenants/12/campaigns'));
  });

  it('updates an existing campaign when the user has update permission', async () => {
    const update = vi.spyOn(apiCaller.campaigns, 'update').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    const existingCampaign = { ...campaign, id: 5, variations: [{ ...campaign.variations[0], traffic: 100 }] };
    renderWithPermissions(<CampaignEditor audiences={[]} campaignId={5} initialCampaign={existingCampaign} tenantId={12} />, [
      getStringPermission({ action: 'update', feature: 'campaign', tenantId: 12 }),
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Save Campaign' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith({ body: existingCampaign, pathParams: { campaignId: 5, tenantId: 12 } }));
    expect(socketEmit).toHaveBeenCalledWith('user-updated-campaign', { campaignId: 5, tenantId: 12 });
    await waitFor(() => expect(location.href).toBe('/tenants/12/campaigns'));
  });

  it('updates the campaign name and inactive status before saving', async () => {
    const update = vi.spyOn(apiCaller.campaigns, 'update').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    const existingCampaign = { ...campaign, id: 5, variations: [{ ...campaign.variations[0], traffic: 100 }] };
    const { container } = renderWithPermissions(<CampaignEditor audiences={[]} campaignId={5} initialCampaign={existingCampaign} tenantId={12} />, [
      getStringPermission({ action: 'update', feature: 'campaign', tenantId: 12 }),
    ]);
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'inactive' } });
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Paused campaign' } });
    expect((container.querySelector('select') as HTMLSelectElement).className).toContain('bg-gray-400');
    fireEvent.click(screen.getByRole('button', { name: 'Save Campaign' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        body: { ...existingCampaign, name: 'Paused campaign', status: 'inactive' },
        pathParams: { campaignId: 5, tenantId: 12 },
      }),
    );
  });

  it('uses the fallback status color for an unknown campaign status', () => {
    const unknownStatusCampaign = { ...campaign, status: 'archived' as unknown as TypeCampaignWithOptionalId['status'] };
    const { container } = renderWithPermissions(<CampaignEditor audiences={[]} campaignId={undefined} initialCampaign={unknownStatusCampaign} tenantId={12} />, [
      getStringPermission({ action: 'create', feature: 'campaign', tenantId: 12 }),
    ]);

    expect((container.querySelector('select') as HTMLSelectElement).className).toContain('bg-red-500');
  });

  it('shows concurrent viewers and blocks save after another campaign editor changes it', () => {
    const existingCampaign = { ...campaign, id: 5, variations: [{ ...campaign.variations[0], traffic: 100 }] };
    renderWithPermissions(<CampaignEditor audiences={[]} campaignId={5} initialCampaign={existingCampaign} tenantId={12} />, [
      getStringPermission({ action: 'update', feature: 'campaign', tenantId: 12 }),
    ]);

    act(() => {
      socketHandlers.get('update-users-watching-campaign')?.([{ id: 2, name: 'Bea' }]);
      socketHandlers.get('user-updated-campaign')?.({ id: 2, name: 'Bea' });
    });

    expect(screen.getByText('Bea').parentElement?.textContent).toContain('updated this data');
    expect((screen.getByRole('button', { name: 'Save Campaign' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('execution group editor', () => {
  it('updates configuration toggles and adds a searched campaign', () => {
    vi.stubGlobal('location', { href: '' });
    const { container } = renderWithPermissions(
      <ExecutionGroupEditor allCampaigns={campaigns} executionGroupId={undefined} initialCampaigns={[campaigns[0]]} initialExecutionGroup={executionGroup} tenantId={12} />,
      [getStringPermission({ action: 'create', feature: 'execution-group', tenantId: 12 })],
    );

    const switches = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(switches[0].checked).toBe(true);
    for (const toggle of switches) fireEvent.click(toggle);
    expect(switches.every((toggle) => !toggle.checked)).toBe(true);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'active' } });
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Updated group' } });
    expect(screen.getByDisplayValue('Updated group')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Search campaigns...'), { target: { value: 'Beta' } });
    fireEvent.mouseDown(screen.getByRole('button', { name: '(id=2): Beta' }));
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(location.href).toBe('/tenants/12/execution-groups');
  });

  it('creates an execution group with selected campaign ids', async () => {
    const create = vi.spyOn(apiCaller.executionGroups, 'create').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    renderWithPermissions(
      <ExecutionGroupEditor allCampaigns={campaigns} executionGroupId={undefined} initialCampaigns={[campaigns[0]]} initialExecutionGroup={executionGroup} tenantId={12} />,
      [getStringPermission({ action: 'create', feature: 'execution-group', tenantId: 12 })],
    );

    fireEvent.change(screen.getByPlaceholderText('Search campaigns...'), { target: { value: 'Beta' } });
    fireEvent.mouseDown(screen.getByRole('button', { name: '(id=2): Beta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save execution group' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        body: { ...executionGroup, campaignIds: [1, 2] },
        pathParams: { tenantId: 12 },
      }),
    );
    await waitFor(() => expect(location.href).toBe('/tenants/12/execution-groups'));
  });

  it('updates an existing group with its selected campaigns', async () => {
    const update = vi.spyOn(apiCaller.executionGroups, 'update').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    const existingGroup = { ...executionGroup, id: 10 };
    renderWithPermissions(
      <ExecutionGroupEditor allCampaigns={campaigns} executionGroupId={10} initialCampaigns={[campaigns[0]]} initialExecutionGroup={existingGroup} tenantId={12} />,
      [getStringPermission({ action: 'update', feature: 'execution-group', tenantId: 12 })],
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save execution group' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        body: { ...existingGroup, campaignIds: [1] },
        pathParams: { executionGroupId: 10, tenantId: 12 },
      }),
    );
    expect(socketEmit).toHaveBeenCalledWith('user-updated-execution-group', { executionGroup: existingGroup, tenantId: 12 });
    await waitFor(() => expect(location.href).toBe('/tenants/12/execution-groups'));
  });

  it('creates a group with selected campaign ids', async () => {
    const create = vi.spyOn(apiCaller.executionGroups, 'create').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    renderWithPermissions(
      <ExecutionGroupEditor allCampaigns={campaigns} executionGroupId={undefined} initialCampaigns={[campaigns[0]]} initialExecutionGroup={executionGroup} tenantId={12} />,
      [getStringPermission({ action: 'create', feature: 'execution-group', tenantId: 12 })],
    );

    fireEvent.change(screen.getByPlaceholderText('Search campaigns...'), { target: { value: 'Beta' } });
    fireEvent.mouseDown(screen.getByRole('button', { name: '(id=2): Beta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save execution group' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        body: expect.objectContaining({ ...executionGroup, campaignIds: [1, 2] }),
        pathParams: { tenantId: 12 },
      }),
    );
    await waitFor(() => expect(location.href).toBe('/tenants/12/execution-groups'));
  });

  it('shows concurrent viewers and blocks save after another group editor changes it', () => {
    const existingGroup = { ...executionGroup, id: 10 };
    renderWithPermissions(
      <ExecutionGroupEditor allCampaigns={campaigns} executionGroupId={10} initialCampaigns={[campaigns[0]]} initialExecutionGroup={existingGroup} tenantId={12} />,
      [getStringPermission({ action: 'update', feature: 'execution-group', tenantId: 12 })],
    );

    act(() => {
      socketHandlers.get('update-users-watching-campaign')?.([{ id: 2, name: 'Bea' }]);
      socketHandlers.get('user-updated-campaign')?.({ id: 2, name: 'Bea' });
    });

    expect(screen.getByText('Bea').parentElement?.textContent).toContain('updated this data');
    expect((screen.getByRole('button', { name: 'Save execution group' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
