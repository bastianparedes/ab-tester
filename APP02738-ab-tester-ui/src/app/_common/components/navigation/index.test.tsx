// @vitest-environment jsdom

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import type { TypeFullUser } from '@/utils/user/helper';
import { CreatorCredit } from '../CreatorCredit';
import { Navigation } from './index';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ComponentLanguage } from './Sidebar/Language';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const tenant: TypeTenant = { description: 'Testing workspace', domain: 'example.test', id: 12, name: 'Acme' };

const renderWithProviders = (children: React.ReactNode, permissions: string[] = [], isLogedIn = false) => {
  const user: TypeFullUser = isLogedIn
    ? { data: { email: 'ada@example.test', id: 1, name: 'Ada', roles: [] }, isLogedIn: true, permissions }
    : { data: null, isLogedIn: false, permissions };

  return render(
    <TranslationProvider language="english">
      <UserProvider user={user}>{children}</UserProvider>
    </TranslationProvider>,
  );
};

describe('Sidebar', () => {
  it('shows only global navigation links when there is no tenant scope', () => {
    renderWithProviders(<Sidebar>Content</Sidebar>, [getStringPermission({ action: 'read', feature: 'role' }), getStringPermission({ action: 'read', feature: 'user' })]);

    expect(screen.getByRole('link', { name: 'Tenants' }).getAttribute('href')).toBe('/tenants');
    expect(screen.getByRole('link', { name: 'Roles' }).getAttribute('href')).toBe('/admin/roles');
    expect(screen.queryByRole('link', { name: 'Campaigns' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Users' }).getAttribute('href')).toBe('/admin/users');
  });

  it('filters tenant navigation links by scoped permissions', () => {
    const permissions = [
      getStringPermission({ action: 'read', feature: 'track-event', tenantId: tenant.id }),
      getStringPermission({ action: 'read', feature: 'audience', tenantId: tenant.id }),
      getStringPermission({ action: 'read', feature: 'campaign', tenantId: tenant.id }),
      getStringPermission({ action: 'read', feature: 'execution-group', tenantId: tenant.id }),
    ];
    renderWithProviders(<Sidebar tenant={tenant}>Content</Sidebar>, permissions);

    expect(screen.getByRole('link', { name: 'Track events' }).getAttribute('href')).toBe('/tenants/12/track-events');
    expect(screen.getByRole('link', { name: 'Audiences' }).getAttribute('href')).toBe('/tenants/12/audiences');
    expect(screen.getByRole('link', { name: 'Campaigns' }).getAttribute('href')).toBe('/tenants/12/campaigns');
    expect(screen.getByRole('link', { name: 'Execution groups' }).getAttribute('href')).toBe('/tenants/12/execution-groups');
  });
});

describe('navigation controls', () => {
  it('switches the selected language and closes the language menu', () => {
    renderWithProviders(<ComponentLanguage />);
    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    fireEvent.click(screen.getByRole('button', { name: /English✓/ }));
    expect(screen.getAllByRole('button', { name: 'English' })).toHaveLength(1);
  });

  it('renders translated breadcrumbs and opens the user menu', async () => {
    vi.spyOn(apiCaller.sessions, 'logOut').mockResolvedValue({ ok: false });
    renderWithProviders(<Navbar breadcrumb={[{ name: 'Tenants', path: '/tenants' }, { name: 'Campaigns' }]}>Campaign list</Navbar>, [], true);

    expect(screen.getByRole('link', { name: 'Tenants' }).getAttribute('href')).toBe('/tenants');
    expect(screen.getByText('Campaigns')).toBeTruthy();
    expect(screen.getByText('Campaign list')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ada/ }));
    expect(screen.getByRole('link', { name: 'Account' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
    await vi.waitFor(() => expect(apiCaller.sessions.logOut).toHaveBeenCalledOnce());
  });

  it('composes the sidebar and navbar around route content', () => {
    renderWithProviders(<Navigation breadcrumb={[{ name: 'Tenants' }]}>Route content</Navigation>);

    expect(screen.getByText('Route content')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Tenants' }).getAttribute('href')).toBe('/tenants');
  });

  it('renders the creator credit from the active translation', () => {
    renderWithProviders(<CreatorCredit />);

    expect(screen.getByText(/Created by/)).toBeTruthy();
  });
});
