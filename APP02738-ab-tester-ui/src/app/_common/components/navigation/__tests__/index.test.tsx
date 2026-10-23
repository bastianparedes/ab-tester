// @vitest-environment jsdom

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as translationContext from '@/app/_common/contexts/Translation';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import type { TypeFullUser } from '@/utils/user/helper';
import { CreatorCredit } from '../../CreatorCredit';
import { Navigation } from '../index';
import { Navbar } from '../Navbar';
import { Sidebar } from '../Sidebar';
import { ComponentLanguage } from '../Sidebar/Language';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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

    const tenantsLink = screen.getByRole('link', { name: 'Tenants' });
    expect(tenantsLink.getAttribute('href')).toBe('/tenants');
    expect(tenantsLink.parentElement).toBe(screen.getByRole('link', { name: 'Roles' }).parentElement);
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

  it('collapses and expands the Testing navigation independently', () => {
    renderWithProviders(<Sidebar tenant={tenant}>Content</Sidebar>, [getStringPermission({ action: 'read', feature: 'audience', tenantId: tenant.id })]);

    const testingButton = screen.getByRole('button', { name: 'Testing' });
    const administrationButton = screen.getByRole('button', { name: 'Administration' });

    expect(testingButton.getAttribute('aria-expanded')).toBe('true');
    expect(testingButton.getAttribute('aria-controls')).toBe('testing-navigation');
    expect(screen.getByRole('link', { name: 'Audiences' })).toBeTruthy();

    fireEvent.click(testingButton);

    expect(testingButton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('link', { name: 'Audiences' })).toBeNull();
    expect(administrationButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('link', { name: 'Tenants' })).toBeTruthy();

    fireEvent.click(testingButton);

    expect(testingButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('link', { name: 'Audiences' })).toBeTruthy();
  });

  it('collapses and expands the Administration navigation independently', () => {
    renderWithProviders(<Sidebar tenant={tenant}>Content</Sidebar>, [
      getStringPermission({ action: 'read', feature: 'audience', tenantId: tenant.id }),
      getStringPermission({ action: 'read', feature: 'role' }),
    ]);

    const testingButton = screen.getByRole('button', { name: 'Testing' });
    const administrationButton = screen.getByRole('button', { name: 'Administration' });

    expect(administrationButton.getAttribute('aria-expanded')).toBe('true');
    expect(administrationButton.getAttribute('aria-controls')).toBe('administration-navigation');
    expect(screen.getByRole('link', { name: 'Tenants' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Roles' })).toBeTruthy();

    fireEvent.click(administrationButton);

    expect(administrationButton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('link', { name: 'Tenants' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Roles' })).toBeNull();
    expect(testingButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('link', { name: 'Audiences' })).toBeTruthy();

    fireEvent.click(administrationButton);

    expect(administrationButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('link', { name: 'Tenants' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Roles' })).toBeTruthy();
  });
});

describe('navigation controls', () => {
  it('switches the selected language and closes the language menu', () => {
    renderWithProviders(<ComponentLanguage />);
    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    fireEvent.click(screen.getByRole('button', { name: /English✓/ }));
    expect(screen.getAllByRole('button', { name: 'English' })).toHaveLength(1);
  });

  it('styles a language differently when it is not the current selection', () => {
    const useOriginalTranslationContext = translationContext.useTranslationContext;
    vi.spyOn(translationContext, 'useTranslationContext').mockImplementation(() => {
      const context = useOriginalTranslationContext();
      Object.defineProperty(context.selectedLanguage, 'key', { value: 'not-selected' });
      return context;
    });
    renderWithProviders(<ComponentLanguage />);
    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getAllByRole('button', { name: 'English' })[0].className).toContain('text-gray-300');
  });

  it('renders translated breadcrumbs and opens the user menu', async () => {
    vi.spyOn(apiCaller.sessions, 'logOut').mockResolvedValue({ ok: false });
    renderWithProviders(<Navbar breadcrumb={[{ name: 'Tenants', path: '/tenants' }, { name: 'Campaigns' }]}>Campaign list</Navbar>, [], true);

    expect(screen.getByRole('link', { name: 'Tenants' }).getAttribute('href')).toBe('/tenants');
    expect(screen.getByText('Campaigns')).toBeTruthy();
    expect(screen.getByText('Campaign list')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ada/ }));
    const accountLink = screen.getByRole('link', { name: 'Account' });
    expect(accountLink).toBeTruthy();
    accountLink.addEventListener('click', (event) => event.preventDefault(), { once: true });
    fireEvent.click(accountLink);
    expect(screen.queryByRole('link', { name: 'Account' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ada/ }));
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
    await vi.waitFor(() => expect(apiCaller.sessions.logOut).toHaveBeenCalledOnce());
  });

  it('redirects home after a successful logout', async () => {
    vi.spyOn(apiCaller.sessions, 'logOut').mockResolvedValue(new Response(null, { status: 200 }) as Awaited<ReturnType<typeof apiCaller.sessions.logOut>>);
    vi.stubGlobal('location', { href: '' });
    renderWithProviders(<Navbar breadcrumb={[]}>Account</Navbar>, [], true);
    fireEvent.click(screen.getByRole('button', { name: /Ada/ }));
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));

    await vi.waitFor(() => expect(location.href).toBe('/'));
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
