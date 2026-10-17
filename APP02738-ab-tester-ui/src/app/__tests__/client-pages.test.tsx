// @vitest-environment jsdom

import type { TypeAudienceForMenu, TypeAudienceWithOptionalId } from '@ab-tester/constants/types/audience';
import type { TypeRole } from '@ab-tester/constants/types/role';
import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import type { TypeUser } from '@ab-tester/constants/types/user';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamicDialog } from '@/app/_common/contexts/Dialog/Component';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import type { TypeFullUser } from '@/utils/user/helper';
import { ClientPage as UsersList } from '../admin/users/clientPage';
import { ClientPage as AudienceEditor } from '../tenants/[tenantId]/audiences/[audienceId]/clientPage';
import { ClientPage as AudienceList } from '../tenants/[tenantId]/audiences/clientPage';
import { ClientPage as TenantsList } from '../tenants/clientPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useDialogStore.setState({ data: null, description: null, isOpen: false, resolver: () => {}, title: null });
});

const renderWithUser = (children: React.ReactNode, permissions: string[]) => {
  const user: TypeFullUser = { data: { email: 'user@example.test', id: 1, name: 'Ada', roles: [] }, isLogedIn: true, permissions };
  return render(
    <TranslationProvider language="english">
      <UserProvider user={user}>{children}</UserProvider>
    </TranslationProvider>,
  );
};

const apiResponse = <T,>(data: T) => ({ json: async () => data, ok: true, text: async () => '' }) as unknown as Awaited<ReturnType<typeof apiCaller.audiences.getMany>>;

describe('audience list client page', () => {
  const audience: TypeAudienceForMenu = { createdAt: new Date('2026-01-01T00:00:00Z'), id: 5, name: 'Visitors', updatedAt: new Date('2026-01-02T00:00:00Z') };

  it('loads audience rows and sends filter and sort changes to the API', async () => {
    const getMany = vi.spyOn(apiCaller.audiences, 'getMany').mockResolvedValue(apiResponse({ audiences: [audience], count: 1 }));
    const tenantId = 12;
    const permissions = [getStringPermission({ action: 'create', feature: 'audience', tenantId }), getStringPermission({ action: 'read', feature: 'audience', tenantId })];
    const { container } = renderWithUser(<AudienceList tenantId={tenantId} />, permissions);

    expect(await screen.findByText('Visitors')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create new audience' }).getAttribute('href')).toBe('/tenants/12/audiences/undefined');

    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'checkout' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'updatedAt', orderDirection: 'desc', page: 0, quantity: 25, textSearch: 'checkout' },
      }),
    );

    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith({
        pathParams: { tenantId },
        queryParams: { orderBy: 'name', orderDirection: 'asc', page: 0, quantity: 25, textSearch: 'checkout' },
      }),
    );
  });

  it('covers audience sort directions, page size, pagination and cancelled deletion', async () => {
    const tenantId = 12;
    const getMany = vi.spyOn(apiCaller.audiences, 'getMany').mockResolvedValue(apiResponse({ audiences: [audience], count: 100 }));
    const deleteAudience = vi.spyOn(apiCaller.audiences, 'delete');
    const { container } = renderWithUser(
      <>
        <AudienceList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'create', feature: 'audience', tenantId }), getStringPermission({ action: 'delete', feature: 'audience', tenantId })],
    );
    expect(await screen.findByText('Visitors')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create new audience' }).getAttribute('href')).toBe('/tenants/12/audiences/undefined');

    fireEvent.click(screen.getByRole('columnheader', { name: /ID/ }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'id', orderDirection: 'asc' }) })));
    fireEvent.click(screen.getByRole('columnheader', { name: /ID/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'id', orderDirection: 'desc' }) })),
    );
    fireEvent.click(screen.getByRole('columnheader', { name: /Updated at/ }));
    await waitFor(() =>
      expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ orderBy: 'updatedAt', orderDirection: 'asc' }) })),
    );

    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'visitor' } });
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ quantity: 50, textSearch: 'visitor' }) })));

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(getMany).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: expect.objectContaining({ page: 1 }) })));

    fireEvent.click(within(screen.getByText('Visitors').closest('tr') as HTMLElement).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));
    expect(deleteAudience).not.toHaveBeenCalled();
  });

  it('keeps the audience list empty when its query fails', async () => {
    const getMany = vi.spyOn(apiCaller.audiences, 'getMany').mockResolvedValue({ ok: false });
    renderWithUser(<AudienceList tenantId={12} />, []);

    await waitFor(() => expect(getMany).toHaveBeenCalledOnce());
    expect(screen.queryByText('Visitors')).toBeNull();
  });

  it('deletes an audience only after the user confirms', async () => {
    const tenantId = 12;
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const deleteAudience = vi.spyOn(apiCaller.audiences, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    const getMany = vi.spyOn(apiCaller.audiences, 'getMany').mockResolvedValue(apiResponse({ audiences: [audience], count: 1 }));
    const { container } = renderWithUser(
      <>
        <AudienceList tenantId={tenantId} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'delete', feature: 'audience', tenantId })],
    );
    await waitFor(() => expect(getMany).toHaveBeenCalledOnce());
    const audienceRow = screen.getByText('Visitors').closest('tr');
    const deleteButton = within(audienceRow as HTMLElement).getByRole('button');
    fireEvent.click(deleteButton);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleteAudience).not.toHaveBeenCalled();

    fireEvent.click(deleteButton);
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(deleteAudience).toHaveBeenCalledWith({ pathParams: { audienceId: 5, tenantId } }));
    expect(reload).toHaveBeenCalledOnce();
    expect(container.querySelector('table')).not.toBeNull();
  });
});

describe('audience editor client page', () => {
  const initialAudience: TypeAudienceWithOptionalId = {
    name: 'New audience',
    requirements: { data: { children: [], operator: 'and' }, type: 'node' },
    tenantId: 12,
  };

  it('creates an audience without rendering requirement controls when no events exist', async () => {
    const create = vi.spyOn(apiCaller.audiences, 'create').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    const { container } = renderWithUser(<AudienceEditor initialAudience={initialAudience} tenantId={12} trackEvents={[]} />, [
      getStringPermission({ action: 'create', feature: 'audience', tenantId: 12 }),
    ]);
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Purchasers' } });
    expect(screen.queryByRole('button', { name: 'New restriction' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save Audience' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ body: { ...initialAudience, name: 'Purchasers' }, pathParams: { tenantId: 12 } }));
    await waitFor(() => expect(location.href).toBe('/tenants/12/audiences'));
  });

  it('updates an existing audience when update permission is present', async () => {
    const update = vi.spyOn(apiCaller.audiences, 'update').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    const audience = { ...initialAudience, id: 5 };
    const { container } = renderWithUser(<AudienceEditor initialAudience={audience} tenantId={12} trackEvents={[]} />, [
      getStringPermission({ action: 'update', feature: 'audience', tenantId: 12 }),
    ]);
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Returning visitors' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Audience' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        body: { ...audience, name: 'Returning visitors' },
        pathParams: { audienceId: 5, tenantId: 12 },
      }),
    );
    await waitFor(() => expect(location.href).toBe('/tenants/12/audiences'));
  });
});

describe('admin users client page', () => {
  const initialUsers: TypeUser[] = [{ email: 'ada@example.test', id: 7, name: 'Ada', roles: [{ description: 'Read', id: 2, name: 'Reader', permissions: [] }] }];

  it('shows rows and gates edit/delete actions by permissions', () => {
    renderWithUser(<UsersList initialUsers={initialUsers} roles={[]} />, [getStringPermission({ action: 'read', feature: 'user' })]);

    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('Reader')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('converts selected role ids to numbers when saving a user', async () => {
    const roles: TypeRole[] = [{ description: 'Read', id: 2, name: 'Reader', permissions: [] }];
    const update = vi.spyOn(apiCaller.users, 'update').mockResolvedValue(new Response('{}', { status: 500 }));
    renderWithUser(
      <>
        <UsersList initialUsers={initialUsers} roles={roles} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'update', feature: 'user' })],
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        body: { email: 'ada@example.test', name: 'Ada', roleIds: [2] },
        pathParams: { userId: 7 },
      }),
    );
  });

  it('removes a user after deletion is confirmed', async () => {
    const deleteUser = vi.spyOn(apiCaller.users, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    renderWithUser(
      <>
        <UsersList initialUsers={initialUsers} roles={[]} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'delete', feature: 'user' })],
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith({ pathParams: { userId: 7 } }));
    await waitFor(() => expect(screen.queryByText('Ada')).toBeNull());
  });

  it('creates a user from the dynamic form', async () => {
    const createUser = vi.spyOn(apiCaller.users, 'create').mockResolvedValue(new Response('{}', { status: 500 }));
    renderWithUser(
      <>
        <UsersList initialUsers={initialUsers} roles={[]} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'create', feature: 'user' })],
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
    fireEvent.change(document.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Bea' } });
    fireEvent.change(document.querySelector('input[type="email"]') as HTMLInputElement, { target: { value: 'bea@example.test' } });
    fireEvent.change(document.querySelector('input[type="password"]') as HTMLInputElement, { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(createUser).toHaveBeenCalledWith({ body: { email: 'bea@example.test', name: 'Bea', password: 'secret' } }));
  });

  it('reloads after successful user creation and update', async () => {
    const reload = vi.fn();
    vi.stubGlobal(
      'window',
      new Proxy(window, {
        get(target, property) {
          if (property === 'location') return { reload };
          return Reflect.get(target, property, target);
        },
      }),
    );
    const createUser = vi.spyOn(apiCaller.users, 'create').mockResolvedValue(new Response('{}', { status: 200 }));
    const updateUser = vi.spyOn(apiCaller.users, 'update').mockResolvedValue(new Response('{}', { status: 200 }));
    const users = [...initialUsers, { email: 'grace@example.test', id: 8, name: 'Grace', roles: [] }];
    renderWithUser(
      <>
        <UsersList initialUsers={users} roles={[]} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'create', feature: 'user' }), getStringPermission({ action: 'update', feature: 'user' })],
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
    fireEvent.change(document.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Bea' } });
    fireEvent.change(document.querySelector('input[type="email"]') as HTMLInputElement, { target: { value: 'bea@example.test' } });
    fireEvent.change(document.querySelector('input[type="password"]') as HTMLInputElement, { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(createUser).toHaveBeenCalledOnce());

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledOnce());
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('does not add, edit or delete a user when the dialog is cancelled', async () => {
    const createUser = vi.spyOn(apiCaller.users, 'create');
    const updateUser = vi.spyOn(apiCaller.users, 'update');
    const deleteUser = vi.spyOn(apiCaller.users, 'delete');
    renderWithUser(
      <>
        <UsersList initialUsers={initialUsers} roles={[]} />
        <DynamicDialog />
      </>,
      [
        getStringPermission({ action: 'create', feature: 'user' }),
        getStringPermission({ action: 'update', feature: 'user' }),
        getStringPermission({ action: 'delete', feature: 'user' }),
      ],
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add user' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));

    expect(createUser).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
    expect(screen.getByText('Ada')).toBeTruthy();
  });

  it('keeps the user listed when the delete request fails', async () => {
    const deleteUser = vi.spyOn(apiCaller.users, 'delete').mockResolvedValue(new Response('{}', { status: 500 }));
    renderWithUser(
      <>
        <UsersList initialUsers={initialUsers} roles={[]} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'delete', feature: 'user' })],
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith({ pathParams: { userId: 7 } }));
    expect(screen.getByText('Ada')).toBeTruthy();
  });
});

describe('tenant list client page', () => {
  const tenants: TypeTenant[] = [
    { description: 'Allowed workspace', domain: 'acme.test', id: 12, name: 'Acme' },
    { description: 'Hidden workspace', domain: 'hidden.test', id: 13, name: 'Hidden' },
  ];

  it('filters tenants by scoped read permission and exposes global create access', () => {
    renderWithUser(<TenantsList initialTenants={tenants} />, [
      getStringPermission({ action: 'read', feature: 'tenant', tenantId: 12 }),
      getStringPermission({ action: 'create', feature: 'tenant' }),
    ]);

    expect(screen.getByText('Acme')).toBeTruthy();
    expect(screen.queryByText('Hidden')).toBeNull();
    expect(screen.getByRole('link', { name: /Acme/ }).getAttribute('href')).toBe('/tenants/12/campaigns');
    expect(screen.getByRole('button', { name: '+ New Tenant' })).toBeTruthy();
  });

  it('submits tenant data collected through the dynamic dialog', async () => {
    const create = vi.spyOn(apiCaller.tenants, 'create').mockResolvedValue(new Response('{}', { status: 500 }));
    const { container } = renderWithUser(
      <>
        <TenantsList initialTenants={tenants} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'create', feature: 'tenant' })],
    );
    fireEvent.click(screen.getByRole('button', { name: '+ New Tenant' }));

    const inputs = container.querySelectorAll('input[type="text"]');
    fireEvent.change(inputs[0], { target: { value: 'new.example.test' } });
    fireEvent.change(inputs[1], { target: { value: 'New workspace' } });
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, { target: { value: 'Created in test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ body: { description: 'Created in test', domain: 'new.example.test', name: 'New workspace' } }));
  });

  it('submits edits for a tenant through the dynamic dialog', async () => {
    const update = vi.spyOn(apiCaller.tenants, 'update').mockResolvedValue(new Response('{}', { status: 500 }));
    const { container } = renderWithUser(
      <>
        <TenantsList initialTenants={tenants} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'read', feature: 'tenant', tenantId: 12 }), getStringPermission({ action: 'update', feature: 'tenant' })],
    );
    fireEvent.click(screen.getByTitle('Edit tenant'));

    const inputs = container.querySelectorAll('input[type="text"]');
    fireEvent.change(inputs[0], { target: { value: 'updated.example.test' } });
    fireEvent.change(inputs[1], { target: { value: 'Acme updated' } });
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, { target: { value: 'Updated workspace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        body: { description: 'Updated workspace', domain: 'updated.example.test', name: 'Acme updated' },
        pathParams: { tenantId: 12 },
      }),
    );
  });

  it('cancels tenant forms and reloads after successful create and update', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const create = vi.spyOn(apiCaller.tenants, 'create').mockResolvedValue(new Response('{}', { status: 200 }));
    const update = vi.spyOn(apiCaller.tenants, 'update').mockResolvedValue(new Response('{}', { status: 200 }));
    const { container } = renderWithUser(
      <>
        <TenantsList initialTenants={tenants} />
        <DynamicDialog />
      </>,
      [
        getStringPermission({ action: 'read', feature: 'tenant', tenantId: 12 }),
        getStringPermission({ action: 'create', feature: 'tenant' }),
        getStringPermission({ action: 'update', feature: 'tenant' }),
      ],
    );

    fireEvent.click(screen.getByRole('button', { name: '+ New Tenant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));
    fireEvent.click(screen.getByTitle('Edit tenant'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(useDialogStore.getState().isOpen).toBe(false));
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '+ New Tenant' }));
    const createInputs = container.querySelectorAll('input[type="text"]');
    fireEvent.change(createInputs[0], { target: { value: 'new.example.test' } });
    fireEvent.change(createInputs[1], { target: { value: 'New workspace' } });
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, { target: { value: 'Created in test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(create).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByTitle('Edit tenant'));
    const editInputs = container.querySelectorAll('input[type="text"]');
    fireEvent.change(editInputs[0], { target: { value: 'updated.example.test' } });
    fireEvent.change(editInputs[1], { target: { value: 'Acme updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('cancels tenant deletion without a request and reloads after confirmation', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const deleteTenant = vi.spyOn(apiCaller.tenants, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    renderWithUser(
      <>
        <TenantsList initialTenants={tenants} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'read', feature: 'tenant', tenantId: 12 }), getStringPermission({ action: 'delete', feature: 'tenant' })],
    );

    fireEvent.click(screen.getByTitle('Delete tenant'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleteTenant).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Delete tenant'));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(deleteTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('keeps the tenant and does not reload when deletion fails', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const deleteTenant = vi.spyOn(apiCaller.tenants, 'delete').mockResolvedValue(new Response('{}', { status: 500 }));
    renderWithUser(
      <>
        <TenantsList initialTenants={tenants} />
        <DynamicDialog />
      </>,
      [getStringPermission({ action: 'read', feature: 'tenant', tenantId: 12 }), getStringPermission({ action: 'delete', feature: 'tenant' })],
    );

    fireEvent.click(screen.getByTitle('Delete tenant'));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(deleteTenant).toHaveBeenCalledWith({ pathParams: { tenantId: 12 } }));

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByText('Acme')).toBeTruthy();
  });
});
