// @vitest-environment jsdom

import type { TypeRole } from '@ab-tester/constants/types/role';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamicDialog } from '@/app/_common/contexts/Dialog/Component';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from '../clientPage';

const initialRole: TypeRole = { description: 'Can manage workspaces', id: 7, name: 'Editor', permissions: [] };
const otherRole: TypeRole = { description: 'Read-only access', id: 8, name: 'Reader', permissions: [] };
const editRolesPermission = getStringPermission({ action: 'update', feature: 'role' });
const createTenantPermission = getStringPermission({ action: 'create', feature: 'tenant' });

const renderRolesPage = (permissions: string[], initialRoles: TypeRole[] = [initialRole]) =>
  render(
    <TranslationProvider language="english">
      <UserProvider
        user={{
          data: { email: 'admin@example.test', id: 1, name: 'Admin', roles: [] },
          isLogedIn: true,
          permissions,
        }}
      >
        <ClientPage initialRoles={initialRoles} tenants={[{ id: 12, name: 'Acme' }]} />
        <DynamicDialog />
      </UserProvider>
    </TranslationProvider>,
  );

describe('roles client page', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('hides role creation and disables permission changes without access', () => {
    renderRolesPage([]);
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));

    expect(screen.queryByRole('button', { name: /Add role/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Activate all' }).hasAttribute('disabled')).toBe(true);
    expect((screen.getAllByRole('checkbox')[0] as HTMLInputElement).disabled).toBe(true);
  });

  it('persists a permission change and updates the active switch', async () => {
    const update = vi.spyOn(apiCaller.roles, 'update').mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof apiCaller.roles.update>>);
    renderRolesPage([editRolesPermission], [initialRole, otherRole]);
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));

    const permissionSwitch = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    fireEvent.click(permissionSwitch);

    await waitFor(() => expect(update).toHaveBeenCalledWith({ body: { ...initialRole, permissions: [createTenantPermission] }, pathParams: { roleId: 7 } }));
    await waitFor(() => expect(permissionSwitch.checked).toBe(true));

    fireEvent.click(permissionSwitch);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1][0].body.permissions).toEqual([]);
  });

  it('activates and deactivates all permissions for global and tenant scopes', async () => {
    const update = vi.spyOn(apiCaller.roles, 'update').mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof apiCaller.roles.update>>);
    renderRolesPage([editRolesPermission]);
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Platform' }));

    fireEvent.click(screen.getByRole('button', { name: 'Activate all' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0][0].body.permissions).toHaveLength(12);
    expect(update.mock.calls[0][0].body.permissions).toContain(getStringPermission({ action: 'create', feature: 'tenant' }));

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate all' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1][0].body.permissions).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Acme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Activate all' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(3));
    const tenantPermissions = update.mock.calls[2][0].body.permissions;
    expect(tenantPermissions).toHaveLength(20);
    expect(tenantPermissions).toContain(getStringPermission({ action: 'create', feature: 'campaign', tenantId: 12 }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Deactivate all' }).hasAttribute('disabled')).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate all' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(4));
    expect(update.mock.calls[3][0].body.permissions).toEqual([]);

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(5));
    expect(update.mock.calls[4][0].body.permissions).toContain(getStringPermission({ action: 'create', feature: 'tenant', tenantId: 12 }));
  });

  it('shows an error message when permission updates fail', async () => {
    const update = vi.spyOn(apiCaller.roles, 'update').mockResolvedValue({ ok: false });
    renderRolesPage([editRolesPermission]);
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect((await screen.findByRole('alert')).textContent).toContain('Could not save permissions.');
  });

  it('reports an error when saving permissions throws', async () => {
    vi.spyOn(apiCaller.roles, 'update').mockRejectedValue(new Error('offline'));
    renderRolesPage([editRolesPermission]);
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    expect((await screen.findByRole('alert')).textContent).toContain('Could not save permissions.');
  });

  it('creates a role from the dynamic form', async () => {
    const create = vi.spyOn(apiCaller.roles, 'create').mockResolvedValue(new Response('{}', { status: 500 }));
    const { container } = renderRolesPage([getStringPermission({ action: 'create', feature: 'role' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Add role' }));
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Auditor' } });
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, { target: { value: 'Read-only access' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ body: { description: 'Read-only access', name: 'Auditor', permissions: [] } }));
  });

  it('reloads after the role API accepts a new role', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const create = vi.spyOn(apiCaller.roles, 'create').mockResolvedValue(new Response('{}', { status: 200 }));
    const { container } = renderRolesPage([getStringPermission({ action: 'create', feature: 'role' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Add role' }));
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Auditor' } });
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, { target: { value: 'Read-only access' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    expect(reload).toHaveBeenCalledOnce();
  });

  it('ignores a second permission toggle while the first save is pending', async () => {
    let resolveUpdate: (value: Awaited<ReturnType<typeof apiCaller.roles.update>>) => void = () => {};
    const updateResult = new Promise<Awaited<ReturnType<typeof apiCaller.roles.update>>>((resolve) => {
      resolveUpdate = resolve;
    });
    const update = vi.spyOn(apiCaller.roles, 'update').mockReturnValue(updateResult);
    renderRolesPage([editRolesPermission]);
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    const permissionSwitch = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    fireEvent.click(permissionSwitch);
    fireEvent.click(permissionSwitch);

    expect(update).toHaveBeenCalledOnce();
    resolveUpdate({ ok: true } as Awaited<ReturnType<typeof apiCaller.roles.update>>);
    await waitFor(() => expect(permissionSwitch.checked).toBe(true));
  });

  it('does not create a role when the dialog is cancelled', () => {
    const create = vi.spyOn(apiCaller.roles, 'create');
    renderRolesPage([getStringPermission({ action: 'create', feature: 'role' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Add role' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(create).not.toHaveBeenCalled();
  });

  it('deletes a role only after confirmation', async () => {
    const deleteRole = vi.spyOn(apiCaller.roles, 'delete').mockResolvedValue(new Response('{}', { status: 200 }));
    renderRolesPage([getStringPermission({ action: 'delete', feature: 'role' })]);
    fireEvent.click(screen.getByTitle('Delete role'));
    expect(screen.getByText('Delete role "Editor"?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(deleteRole).toHaveBeenCalledWith({ pathParams: { roleId: 7 } }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Editor' })).toBeNull());
  });

  it('keeps the role when deletion is cancelled', () => {
    const deleteRole = vi.spyOn(apiCaller.roles, 'delete');
    renderRolesPage([getStringPermission({ action: 'delete', feature: 'role' })]);
    fireEvent.click(screen.getByTitle('Delete role'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(deleteRole).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Editor' })).toBeTruthy();
  });

  it('keeps the role when its delete request fails', async () => {
    const deleteRole = vi.spyOn(apiCaller.roles, 'delete').mockResolvedValue(new Response('{}', { status: 500 }));
    renderRolesPage([getStringPermission({ action: 'delete', feature: 'role' })]);
    fireEvent.click(screen.getByTitle('Delete role'));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(deleteRole).toHaveBeenCalledWith({ pathParams: { roleId: 7 } }));
    expect(screen.getByRole('button', { name: 'Editor' })).toBeTruthy();
  });
});
