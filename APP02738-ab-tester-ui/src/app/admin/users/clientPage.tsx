'use client';

import type { TypeRole } from '@ab-tester/constants/types/role';
import type { TypeUser } from '@ab-tester/constants/types/user';
import { KeyRound, Pencil, Plus, Power } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/app/_common/components/DataTable';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import { apiCaller } from '@/libs/restClient';

type Props = {
  initialUsers: TypeUser[];
  roles: TypeRole[];
};

export function ClientPage({ initialUsers, roles }: Props) {
  const { translation } = useTranslationContext();
  const [users, setUsers] = useState(initialUsers);
  const getDataFromForm = useDialogStore((state) => state.getDataFromForm);
  const currentUser = useUser();

  const handleAdd = async () => {
    const data = await getDataFromForm(
      {
        title: translation.users.newUser,
      },
      // biome-ignore assist/source/useSortedKeys: preserve form field order
      {
        name: {
          label: translation.users.name,
          required: true,
          type: 'text',
          value: '',
        },
        email: {
          forbiddenValues: users.map((user) => user.email),
          label: translation.users.email,
          required: true,
          type: 'email',
          value: '',
        },
        password: {
          label: translation.users.password,
          required: true,
          type: 'password',
          value: '',
        },
      },
    );
    if (!data) return;

    const apiResponse = await apiCaller.users.create({
      body: {
        email: data.email,
        name: data.name,
        password: data.password,
      },
    });
    if (apiResponse.ok) return window.location.reload();
  };

  const handleEdit = async ({ user }: { user: TypeUser }) => {
    const rawData = await getDataFromForm(
      {
        title: `${translation.users.editUser} "${user.name}"`,
      },
      // biome-ignore assist/source/useSortedKeys: preserve form field order
      {
        name: {
          label: translation.users.name,
          required: true,
          type: 'text',
          value: user.name,
        },
        email: {
          forbiddenValues: users.filter((userInArray) => userInArray.email !== user.email).map((userInArray) => userInArray.email),
          label: translation.users.email,
          required: true,
          type: 'email',
          value: user.email,
        },
        roleIds: {
          label: translation.users.roles,
          options: roles.map((role) => ({
            label: `(ID: ${role.id}) -> ${role.name}`,
            value: String(role.id),
          })),
          type: 'multiselect',
          value: user.roles.map((role) => String(role.id)),
        },
      },
    );
    if (!rawData) return;
    const data = { ...rawData, roleIds: rawData.roleIds.map((roleId) => Number(roleId)) };

    const apiResponse = await apiCaller.users.update({
      body: {
        email: data.email,
        name: data.name,
        roleIds: data.roleIds,
        status: user.status,
      },
      pathParams: { userId: user.id },
    });
    if (apiResponse.ok) return window.location.reload();
  };

  const handleToggleStatus = async ({ user }: { user: TypeUser }) => {
    const status = user.status === 'active' ? 'inactive' : 'active';
    const apiResponse = await apiCaller.users.update({
      body: {
        email: user.email,
        name: user.name,
        roleIds: user.roles.map((role) => role.id),
        status,
      },
      pathParams: { userId: user.id },
    });
    if (apiResponse.ok) setUsers((currentState) => currentState.map((userInArray) => (userInArray.id === user.id ? { ...userInArray, status } : userInArray)));
  };

  const handleResetPassword = async ({ user }: { user: TypeUser }) => {
    const data = await getDataFromForm(
      { title: `${translation.users.resetPassword}: ${user.name}` },
      {
        newPassword: {
          label: translation.users.newPassword,
          required: true,
          type: 'password',
          value: '',
        },
      },
    );
    if (!data) return;

    const apiResponse = await apiCaller.users.resetPassword({
      body: { newPassword: data.newPassword },
      pathParams: { userId: user.id },
    });
    if (apiResponse.ok) return window.location.reload();
  };

  return (
    <div className="bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-slate-900">{translation.users.userManagement}</h1>
          {currentUser.hasPermission({ action: 'create', feature: 'user' }) && (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2"
            >
              <Plus size={20} /> {translation.users.addUser}
            </button>
          )}
        </div>

        <DataTable
          rows={users}
          getRowKey={(user) => user.email}
          rowClassName="hover:bg-slate-50 transition-colors"
          columns={[
            {
              label: translation.users.name,
              renderCell: (user) => <span className="whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</span>,
            },
            {
              label: translation.users.email,
              renderCell: (user) => <span className="whitespace-nowrap text-sm text-slate-500">{user.email}</span>,
            },
            {
              label: translation.users.roles,
              renderCell: (user) => (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <span key={role.id} className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      {role.name}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              label: translation.users.status,
              renderCell: (user) => (
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {user.status === 'active' ? translation.users.active : translation.users.inactive}
                </span>
              ),
            },
            {
              label: translation.users.editUser,
              renderCell: (user) =>
                currentUser.hasPermission({ action: 'update', feature: 'user' }) && (
                  <button
                    type="button"
                    onClick={() => handleEdit({ user })}
                    className="inline-flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-blue-700 transition hover:enabled:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    <Pencil size={16} />
                    {translation.users.edit}
                  </button>
                ),
            },
            {
              label: translation.users.statusAction,
              renderCell: (user) =>
                currentUser.hasPermission({ action: 'update', feature: 'user' }) && (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus({ user })}
                    className={`inline-flex items-center gap-1 rounded px-3 py-1 transition hover:enabled:opacity-80 disabled:cursor-not-allowed disabled:opacity-80 ${
                      user.status === 'active' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    <Power size={16} />
                    {user.status === 'active' ? translation.users.deactivate : translation.users.activate}
                  </button>
                ),
            },
            {
              label: translation.users.resetPassword,
              renderCell: (user) =>
                currentUser.hasPermission({ action: 'update', feature: 'user' }) && (
                  <button
                    type="button"
                    onClick={() => handleResetPassword({ user })}
                    className="inline-flex items-center gap-1 rounded bg-amber-100 px-3 py-1 text-amber-800 transition hover:enabled:bg-amber-200"
                  >
                    <KeyRound size={16} />
                    {translation.users.resetPassword}
                  </button>
                ),
            },
          ]}
          emptyMessage={translation.users.noData}
        />
      </div>
    </div>
  );
}
