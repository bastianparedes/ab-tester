// @vitest-environment jsdom

import type { TypeUser } from '@ab-tester/constants/types/user';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { UserProvider } from '../_common/contexts/User';
import AdminAccountPage from '../admin/account/page';
import AdminLayout from '../admin/layout';
import RootLayout from '../layout';
import NotFound from '../not-found';
import Page from '../page';
import PlaygroundPage from '../tenants/[tenantId]/playground/page';
import TenantsLayout from '../tenants/layout';

const cookiesMock = vi.hoisted(() => vi.fn());
vi.mock('next/headers', () => ({ cookies: cookiesMock }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  cookiesMock.mockReset();
});

const readUserPermission = getStringPermission({ action: 'read', feature: 'user' });
const user: TypeUser = {
  email: 'ada@example.test',
  id: 1,
  name: 'Ada',
  roles: [{ description: 'Can read users', id: 2, name: 'Reader', permissions: [readUserPermission] }],
};

describe('global route pages', () => {
  it('redirects the root route to login', () => {
    expect(Page).toThrow();
  });

  it('renders the not-found message and home link', () => {
    render(
      <TranslationProvider language="english">
        <NotFound />
      </TranslationProvider>,
    );

    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/');
  });

  it('wraps the admin account settings page in navigation', async () => {
    const result = (await AdminAccountPage()) as ReactElement<{ breadcrumb: { name: string }[]; children: ReactElement }>;

    expect(result.props.breadcrumb).toEqual([{ name: 'Users' }]);
    expect(result.props.children).toBeTruthy();
  });

  it('reads the language cookie for the root layout provider', async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'english' }) });

    const result = (await RootLayout({ children: <span>Root child</span> })) as ReactElement<{
      children: ReactElement<{ children: ReactElement<{ language: string }> }>;
    }>;

    expect(result.props.children.props.children.props.language).toBe('english');
  });

  it('renders the playground in the selected language after loading its tenant', async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'english' }) });
    const getTenant = vi
      .spyOn(apiCaller.tenants, 'get')
      .mockResolvedValue(new Response(JSON.stringify({ description: 'Workspace', domain: 'example.test', id: 12, name: 'Acme' })));
    const playground = await PlaygroundPage({ params: Promise.resolve({ tenantId: '12' }) });

    render(
      <TranslationProvider language="english">
        <UserProvider user={{ data: null, isLogedIn: false, permissions: [] }}>{playground}</UserProvider>
      </TranslationProvider>,
    );

    expect(getTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } });
    expect(screen.getByText('AB Tester')).toBeTruthy();
  });
});

describe('user layouts', () => {
  it.each([
    ['admin', AdminLayout],
    ['tenant', TenantsLayout],
  ])('loads user context for the %s layout', async (_name, Layout) => {
    vi.spyOn(apiCaller.users, 'get').mockResolvedValue(new Response(JSON.stringify(user)));
    const child = <span>Protected content</span>;

    const result = (await Layout({ children: child })) as ReactElement<{ children: ReactElement; user: { data: TypeUser; isLogedIn: boolean; permissions: string[] } }>;

    expect(result.props.user).toMatchObject({ data: user, isLogedIn: true });
    expect(result.props.children).toBe(child);
    expect(result.props.user.permissions).toContain(readUserPermission);
  });
});
