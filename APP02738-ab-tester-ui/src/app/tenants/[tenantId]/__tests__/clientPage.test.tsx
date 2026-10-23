// @vitest-environment jsdom

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import type { TypeFullUser } from '@/utils/user/helper';
import { ClientPage } from '../clientPage';

afterEach(cleanup);

const tenant: TypeTenant = {
  description: 'A/B testing for Acme',
  domain: 'acme.example.com',
  id: 12,
  name: 'Acme',
};

const renderClientPage = (permissions: string[] = []) => {
  const user: TypeFullUser = {
    data: null,
    isLogedIn: false,
    permissions,
  };

  return render(
    <TranslationProvider language="english">
      <UserProvider user={user}>
        <ClientPage tenant={tenant} />
      </UserProvider>
    </TranslationProvider>,
  );
};

describe('tenant home page', () => {
  it('shows the tenant navigation cards available in the sidebar', () => {
    renderClientPage([
      getStringPermission({ action: 'read', feature: 'track-event', tenantId: 12 }),
      getStringPermission({ action: 'read', feature: 'audience', tenantId: 12 }),
      getStringPermission({ action: 'read', feature: 'campaign', tenantId: 12 }),
      getStringPermission({ action: 'read', feature: 'execution-group', tenantId: 12 }),
    ]);

    expect(screen.getByRole('heading', { name: 'Acme' })).toBeTruthy();
    expect(screen.getByText('A/B testing for Acme')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Track events' }).getAttribute('href')).toBe('/tenants/12/track-events');
    expect(screen.getByRole('link', { name: 'Audiences' }).getAttribute('href')).toBe('/tenants/12/audiences');
    expect(screen.getByRole('link', { name: 'Campaigns' }).getAttribute('href')).toBe('/tenants/12/campaigns');
    expect(screen.getByRole('link', { name: 'Execution groups' }).getAttribute('href')).toBe('/tenants/12/execution-groups');
    expect(screen.getByRole('link', { name: 'Lifecycle hooks' }).getAttribute('href')).toBe('/tenants/12/lifecycle-hooks');
    expect(screen.getByRole('link', { name: 'Script and URL' }).getAttribute('href')).toBe('/tenants/12/script');
    expect(screen.getByRole('link', { name: 'Playground' }).getAttribute('href')).toBe('/tenants/12/playground');
  });

  it('hides permission-scoped cards when the user lacks access', () => {
    renderClientPage();

    expect(screen.queryByRole('link', { name: 'Track events' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Audiences' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Campaigns' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Execution groups' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Lifecycle hooks' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Script and URL' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Playground' })).toBeTruthy();
  });
});
