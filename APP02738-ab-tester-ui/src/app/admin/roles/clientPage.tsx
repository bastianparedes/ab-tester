'use client';

import type { TypeRole } from '@ab-tester/constants/types/role';
import { TypeTenant } from '@ab-tester/constants/types/tenant';
import { CheckCheck, CircleOff, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '@/app/_common/components/switch';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';

const globalPermissions = [
  { action: 'create', feature: 'tenant' },
  { action: 'read', feature: 'tenant' },
  { action: 'update', feature: 'tenant' },
  { action: 'delete', feature: 'tenant' },

  { action: 'create', feature: 'role' },
  { action: 'read', feature: 'role' },
  { action: 'update', feature: 'role' },
  { action: 'delete', feature: 'role' },

  { action: 'create', feature: 'user' },
  { action: 'read', feature: 'user' },
  { action: 'update', feature: 'user' },
  { action: 'delete', feature: 'user' },
] as const;

const tenantPermissions = [
  { action: 'create', feature: 'tenant' },
  { action: 'read', feature: 'tenant' },
  { action: 'update', feature: 'tenant' },
  { action: 'delete', feature: 'tenant' },

  { action: 'create', feature: 'track-event' },
  { action: 'read', feature: 'track-event' },
  { action: 'update', feature: 'track-event' },
  { action: 'delete', feature: 'track-event' },

  { action: 'create', feature: 'audience' },
  { action: 'read', feature: 'audience' },
  { action: 'update', feature: 'audience' },
  { action: 'delete', feature: 'audience' },

  { action: 'create', feature: 'campaign' },
  { action: 'read', feature: 'campaign' },
  { action: 'update', feature: 'campaign' },
  { action: 'delete', feature: 'campaign' },

  { action: 'create', feature: 'execution-group' },
  { action: 'read', feature: 'execution-group' },
  { action: 'update', feature: 'execution-group' },
  { action: 'delete', feature: 'execution-group' },
] as const;

type Props = {
  initialRoles: TypeRole[];
  tenants: { id: TypeTenant['id']; name: TypeTenant['name'] }[];
};

export function ClientPage({ initialRoles, tenants }: Props) {
  const { translation } = useTranslationContext();
  const [roles, setRoles] = useState(initialRoles);
  const [scope, setScope] = useState<'global' | number>('global'); // global or tenant ID
  const [selectedRoleId, setSelectedRole] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const getDataFromForm = useDialogStore((state) => state.getDataFromForm);
  const confirm = useDialogStore((state) => state.confirm);
  const user = useUser();

  const currentRole = roles.find((r) => r.id === selectedRoleId);
  const canUpdatePermissions = user.permissions.includes(getStringPermission({ action: 'update', feature: 'role' }));

  const addRole = async () => {
    const data = await getDataFromForm(
      {
        title: translation.roles.newRole,
      },
      // biome-ignore assist/source/useSortedKeys: preserve form field order
      {
        name: {
          forbiddenValues: [...roles.map((role) => role.name)],
          label: translation.roles.name,
          required: true,
          type: 'text',
          value: '',
        },
        description: {
          label: translation.roles.description,
          required: true,
          type: 'textarea',
          value: '',
        },
      },
    );
    if (!data) return;
    const apiResult = await apiCaller.roles.create({
      body: {
        description: data.description,
        name: data.name,
        permissions: [],
      },
    });
    if (apiResult.ok) {
      location.reload();
    }
  };

  const deleteRole = async (role: TypeRole) => {
    const result = await confirm({ title: translation.roles.deleteRoleTitle.replace('{name}', role.name) });
    if (!result) return;
    const apiResult = await apiCaller.roles.delete({
      pathParams: { roleId: role.id },
    });
    if (apiResult.ok) setRoles((currentState) => currentState.filter((roleInList) => roleInList.id !== role.id));
  };

  const updatePermissions = async (role: TypeRole, permissions: string[]) => {
    if (!canUpdatePermissions || isSaving) return;
    const newRole = { ...role, permissions };
    setIsSaving(true);
    setSaveError(null);

    try {
      const apiResult = await apiCaller.roles.update({
        body: newRole,
        pathParams: { roleId: role.id },
      });

      if (!apiResult.ok) {
        setSaveError(translation.roles.savePermissionsError);
        return;
      }

      setRoles((currentState) => currentState.map((roleInArray) => (roleInArray.id === newRole.id ? newRole : roleInArray)));
    } catch {
      setSaveError(translation.roles.savePermissionsError);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = async ({ role, permission }: { role: TypeRole; permission: string }) => {
    const permissions = role.permissions.includes(permission)
      ? role.permissions.filter((permissionInRole) => permissionInRole !== permission)
      : [...role.permissions, permission];
    await updatePermissions(role, permissions);
  };

  const setAllPermissions = async (role: TypeRole, active: boolean) => {
    const scopePermissions = (scope === 'global' ? globalPermissions : tenantPermissions).map((permission) =>
      getStringPermission({ ...permission, tenantId: scope === 'global' ? null : scope }),
    );
    const permissions = active ? [...new Set([...role.permissions, ...scopePermissions])] : role.permissions.filter((permission) => !scopePermissions.includes(permission));
    await updatePermissions(role, permissions);
  };

  return (
    <div className="flex">
      {/* Panel izquierdo - Roles */}
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{translation.roles.roles}</h2>
          <p className="text-sm text-gray-500 mt-1">{translation.roles.selectRole}</p>
        </div>

        <div className="p-4 space-y-2">
          {user.permissions.includes(getStringPermission({ action: 'create', feature: 'role' })) && (
            <button
              type="button"
              onClick={() => addRole()}
              className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center space-x-2 text-gray-600 transition-all enabled:hover:border-blue-500 enabled:hover:bg-blue-50 enabled:hover:text-blue-600 disabled:opacity-80 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">{translation.roles.addRole}</span>
            </button>
          )}

          {roles.map((role) => (
            <div
              key={role.id}
              className={`w-full text-left p-4 rounded-lg transition-all flex justify-between items-center ${selectedRoleId === role.id ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
            >
              {/* Main button to select a role */}
              <button type="button" onClick={() => setSelectedRole(role.id)} className="flex-1 text-left">
                <div className="font-semibold text-gray-900">{role.name}</div>
              </button>

              {/* Separate button to delete a role */}
              {user.permissions.includes(getStringPermission({ action: 'delete', feature: 'role' })) && (
                <button
                  type="button"
                  onClick={() => deleteRole(role)}
                  className="transition-all p-2 bg-red-100 hover:bg-red-200 rounded-lg ml-2"
                  title={translation.roles.deleteRole}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SCOPE */}
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{translation.roles.scope}</h2>
          <p className="text-sm text-gray-500 mt-1">{translation.roles.assignScope}</p>
        </div>

        <div className="p-4 space-y-2">
          <div className="text-sm text-blue-600 border-b border-solid border-blue-600">{translation.roles.global}</div>
          <button
            className={`w-full text-left p-4 rounded-lg transition-all flex justify-between items-center ${scope === 'global' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
            type="button"
            onClick={() => setScope('global')}
          >
            <div className="font-semibold text-gray-900">{translation.roles.platform}</div>
          </button>
        </div>

        <div className="p-4 space-y-2">
          <div className="text-sm text-blue-600 border-b border-solid border-blue-600">{translation.roles.tenants}</div>
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              className={`w-full text-left p-4 rounded-lg transition-all flex justify-between items-center ${scope === tenant.id ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
              type="button"
              onClick={() => setScope(tenant.id)}
            >
              <div className="font-semibold text-gray-900">{tenant.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* PERMISSIONS */}
      {currentRole && (
        <div className="flex-1">
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{translation.roles.permissions}</h2>
                <p className="text-sm text-gray-500 mt-1">{translation.roles.activateOrDeactivatePermissions}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canUpdatePermissions || isSaving}
                  onClick={() => setAllPermissions(currentRole, true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 enabled:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden="true" />
                  {translation.roles.activateAll}
                </button>
                <button
                  type="button"
                  disabled={!canUpdatePermissions || isSaving}
                  onClick={() => setAllPermissions(currentRole, false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 enabled:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CircleOff className="h-4 w-4" aria-hidden="true" />
                  {translation.roles.deactivateAll}
                </button>
              </div>
            </div>
            {saveError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {saveError}
              </p>
            )}
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {scope === 'global' &&
                globalPermissions.map((globalPermission) => {
                  const stringPermission = getStringPermission({ action: globalPermission.action, feature: globalPermission.feature });
                  const isActive = currentRole.permissions.includes(stringPermission);

                  return (
                    <div key={stringPermission} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{stringPermission}</h3>
                        </div>
                        <Switch
                          disabled={!canUpdatePermissions || isSaving}
                          checked={isActive}
                          onChange={() => togglePermission({ permission: stringPermission, role: currentRole })}
                        />
                      </div>
                    </div>
                  );
                })}

              {typeof scope === 'number' &&
                tenantPermissions.map((tenantPermission) => {
                  const stringPermission = getStringPermission({ action: tenantPermission.action, feature: tenantPermission.feature, tenantId: scope });
                  const isActive = currentRole.permissions.includes(stringPermission);

                  return (
                    <div key={stringPermission} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{stringPermission}</h3>
                        </div>
                        <Switch
                          disabled={!canUpdatePermissions || isSaving}
                          checked={isActive}
                          onChange={() => togglePermission({ permission: stringPermission, role: currentRole })}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
