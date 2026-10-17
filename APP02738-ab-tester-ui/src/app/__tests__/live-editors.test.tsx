// @vitest-environment jsdom

import type { TypeCampaignWithOptionalId, TypeCustomRequirement } from '@ab-tester/constants/types/campaign';
import type { TypeTrackEventWithOptionalId } from '@ab-tester/constants/types/trackEvents';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import type { TypeFullUser } from '@/utils/user/helper';
import { LiveViewersNavbar as CampaignLiveViewers } from '../tenants/[tenantId]/campaigns/[campaignId]/components/LiveViewersBar';
import { LiveViewersNavbar as ExecutionGroupLiveViewers } from '../tenants/[tenantId]/execution-groups/[executionGroupId]/components/LiveViewersBar';
import { LiveViewersNavbar } from '../tenants/[tenantId]/lifecycle-hooks/[lifecycleHookId]/components/LiveViewersBar';
import { ClientPage as TrackEventEditor } from '../tenants/[tenantId]/track-events/[trackEventId]/clientPage';
import CustomRequirementEditor from '../tenants/[tenantId]/track-events/[trackEventId]/components/Editor';
import { LiveViewersNavbar as TrackEventLiveViewers } from '../tenants/[tenantId]/track-events/[trackEventId]/components/LiveViewersBar';

const socketHandlers = vi.hoisted(() => new Map<string, (payload: unknown) => void>());
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value }: { onChange?: (value: string) => void; value: string }) => (
    <textarea aria-label="JavaScript editor" onChange={(event) => onChange?.(event.target.value)} value={value} />
  ),
}));
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn((event: string, handler: (payload: unknown) => void) => socketHandlers.set(event, handler)),
  })),
}));

afterEach(() => {
  cleanup();
  socketHandlers.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const renderWithUser = (children: React.ReactNode, user: TypeFullUser) =>
  render(
    <TranslationProvider language="english">
      <UserProvider user={user}>{children}</UserProvider>
    </TranslationProvider>,
  );

const currentUser: TypeFullUser = {
  data: { email: 'ada@example.test', id: 1, name: 'Ada', roles: [] },
  isLogedIn: true,
  permissions: [],
};

describe('lifecycle hook live viewers', () => {
  it('hides an empty indicator and excludes the current user from counts', () => {
    const { rerender } = renderWithUser(<LiveViewersNavbar userMadeChange={null} usersWatching={[]} />, currentUser);
    expect(screen.queryByRole('navigation')).toBeNull();

    rerender(
      <TranslationProvider language="english">
        <UserProvider user={currentUser}>
          <LiveViewersNavbar
            userMadeChange={null}
            usersWatching={[
              { id: 1, name: 'Ada' },
              { id: 2, name: 'Bea' },
            ]}
          />
        </UserProvider>
      </TranslationProvider>,
    );

    expect(screen.getByRole('button').textContent).toContain('1 people viewing');
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(screen.getByText('Bea')).toBeTruthy();
    expect(screen.queryByText('Ada')).toBeNull();
  });

  it('shows a warning when another editor changed the hook', () => {
    renderWithUser(<LiveViewersNavbar userMadeChange={{ date: new Date('2026-01-01T00:00:00Z'), id: 2, name: 'Bea' }} usersWatching={[]} />, currentUser);

    expect(screen.getByText('Bea').parentElement?.textContent).toContain('updated this data');
    expect(screen.getByText(/Reload the page to make changes/)).toBeTruthy();
  });
});

describe.each([
  ['campaign', CampaignLiveViewers],
  ['execution group', ExecutionGroupLiveViewers],
  ['track event', TrackEventLiveViewers],
])('%s live viewers', (_name, Viewers) => {
  it('shows the remaining viewers and their tooltip', () => {
    renderWithUser(
      <Viewers
        userMadeChange={null}
        usersWatching={[
          { id: 1, name: 'Ada' },
          { id: 3, name: 'Cy' },
        ]}
      />,
      currentUser,
    );

    expect(screen.getByRole('button').textContent).toContain('1 people viewing');
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(screen.getByText('Cy')).toBeTruthy();
    expect(screen.queryByText('Ada')).toBeNull();
    fireEvent.mouseLeave(screen.getByRole('button'));
    expect(screen.queryByText('Cy')).toBeNull();
  });
});

describe('track event custom code editor', () => {
  const requirement: TypeCustomRequirement = { data: { javascript: 'return true;', name: 'Rule' }, type: 'custom' };
  const campaign: TypeCampaignWithOptionalId = {
    executionGroupId: null,
    name: 'Campaign',
    requirements: { data: { children: [requirement], operator: 'and' }, type: 'node' },
    status: 'active',
    tenantId: 12,
    triggers: [],
    variations: [],
  };

  it('saves valid code and discards edits when the modal closes', () => {
    let currentCampaign = campaign;
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      currentCampaign = update(currentCampaign);
    };
    render(
      <TranslationProvider language="english">
        <CustomRequirementEditor requirement={requirement} setCampaign={setCampaign} />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'return false;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(requirement.data.javascript).toBe('return false;');

    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'invalid (' } });
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('data-testid-button-closer-modal'));

    fireEvent.click(screen.getByRole('button'));
    expect((screen.getByRole('textbox', { name: 'JavaScript editor' }) as HTMLTextAreaElement).value).toBe('return false;');
    expect(currentCampaign.requirements.data.children[0]).toEqual(requirement);
  });
});

describe('track event editor', () => {
  const initialTrackEvent: TypeTrackEventWithOptionalId = {
    javascript: 'invalid (',
    multipleTimes: false,
    name: 'Checkout',
    status: 'inactive',
    tenantId: 12,
  };

  it('gates saving on valid JavaScript and exposes state controls only with permission', () => {
    const permissions = [getStringPermission({ action: 'create', feature: 'track-event', tenantId: 12 })];
    renderWithUser(<TrackEventEditor initialTrackEvent={initialTrackEvent} tenantId={12} trackEventId={undefined} />, {
      data: currentUser.data,
      isLogedIn: true,
      permissions,
    });

    const save = screen.getByRole('button', { name: 'Save track event' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'return true;' } });
    expect(save.disabled).toBe(false);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'active' } });
    fireEvent.click(screen.getByRole('checkbox'));
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('hides the save action when the user cannot create track events', () => {
    renderWithUser(<TrackEventEditor initialTrackEvent={initialTrackEvent} tenantId={12} trackEventId={undefined} />, currentUser);

    expect(screen.queryByRole('button', { name: 'Save track event' })).toBeNull();
  });

  it('creates a valid track event and redirects to its list', async () => {
    const create = vi.spyOn(apiCaller.trackEvents, 'create').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    const validTrackEvent = { ...initialTrackEvent, javascript: 'return true;' };
    renderWithUser(<TrackEventEditor initialTrackEvent={validTrackEvent} tenantId={12} trackEventId={undefined} />, {
      data: currentUser.data,
      isLogedIn: true,
      permissions: [getStringPermission({ action: 'create', feature: 'track-event', tenantId: 12 })],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save track event' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ body: validTrackEvent, pathParams: { tenantId: 12 } }));
    await waitFor(() => expect(location.href).toBe('/tenants/12/track-events'));
  });

  it('updates an existing track event with its current fields', async () => {
    const update = vi.spyOn(apiCaller.trackEvents, 'update').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    const existingTrackEvent = { ...initialTrackEvent, javascript: 'return true;', id: 8, multipleTimes: true, name: 'Checkout complete', status: 'active' as const };
    renderWithUser(<TrackEventEditor initialTrackEvent={existingTrackEvent} tenantId={12} trackEventId={8} />, {
      data: currentUser.data,
      isLogedIn: true,
      permissions: [getStringPermission({ action: 'update', feature: 'track-event', tenantId: 12 })],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save track event' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith({ body: existingTrackEvent, pathParams: { tenantId: 12, trackEventId: 8 } }));
    await waitFor(() => expect(location.href).toBe('/tenants/12/track-events'));
  });

  it('shows the live-view warning and disables save after another event editor changes it', () => {
    const existingTrackEvent = { ...initialTrackEvent, javascript: 'return true;', id: 8 };
    renderWithUser(<TrackEventEditor initialTrackEvent={existingTrackEvent} tenantId={12} trackEventId={8} />, {
      data: currentUser.data,
      isLogedIn: true,
      permissions: [getStringPermission({ action: 'update', feature: 'track-event', tenantId: 12 })],
    });

    act(() => {
      socketHandlers.get('update-users-watching-trackEvent')?.([{ id: 2, name: 'Bea' }]);
      socketHandlers.get('user-updated-trackEvent')?.({ id: 2, name: 'Bea' });
    });

    expect(screen.getByText('Bea').parentElement?.textContent).toContain('updated this data');
    expect((screen.getByRole('button', { name: 'Save track event' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
