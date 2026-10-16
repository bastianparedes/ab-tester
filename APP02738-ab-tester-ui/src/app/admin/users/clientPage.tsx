'use client';

import type { TypeRole } from '@ab-tester/constants/types/role';
import type { TypeUser } from '@ab-tester/constants/types/user';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';

type Props = {
  initialUsers: TypeUser[];
  roles: TypeRole[];
};

export function ClientPage({ initialUsers, roles }: Props) {
  const { translation } = useTranslationContext();
  const [users, setUsers] = useState(initialUsers);
  const getDataFromForm = useDialogStore((state) => state.getDataFromForm);
  const confirm = useDialogStore((state) => state.confirm);
  const currentUser = useUser();

  const handleAdd = async () => {
    const data = await getDataFromForm(
      {
        title: translation.users.newUser,
      },
      {
        email: {
          forbiddenValues: users.map((user) => user.email),
          label: translation.users.email,
          required: true,
          type: 'email',
          value: '',
        },
        name: {
          label: translation.users.name,
          required: true,
          type: 'text',
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
      // biome-ignore assist/source/useSortedKeys: <This changes the order>
      {
        roleIds: {
          label: translation.users.roles,
          options: roles.map((role) => ({
            label: `(ID: ${role.id}) -> ${role.name}`,
            value: String(role.id),
          })),
          type: 'multiselect',
          value: user.roles.map((role) => String(role.id)),
        },
        email: {
          forbiddenValues: users.filter((userInArray) => userInArray.email !== user.email).map((userInArray) => userInArray.email),
          label: translation.users.email,
          required: true,
          type: 'email',
          value: user.email,
        },
        name: {
          label: translation.users.name,
          required: true,
          type: 'text',
          value: user.name,
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
      },
      pathParams: { userId: user.id },
    });
    if (apiResponse.ok) return window.location.reload();
  };

  const handleDelete = async ({ user }: { user: TypeUser }) => {
    const result = await confirm({ title: translation.users.deleteUserTitle.replace('{name}', user.name) });
    if (!result) return;
    const apiResponse = await apiCaller.users.delete({
      pathParams: { userId: user.id },
    });
    if (apiResponse.ok) setUsers((currentState) => currentState.filter((userInArray) => userInArray.id !== user.id));
  };

  return (
    <div className="bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">{translation.users.userManagement}</h1>
            {currentUser.permissions.includes(getStringPermission({ action: 'create', feature: 'user' })) && (
              <button
                type="button"
                onClick={handleAdd}
                className="bg-blue-600 hover:enabled:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-80 disabled:cursor-not-allowed"
              >
                <Plus size={20} /> {translation.users.addUser}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translation.users.name}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translation.users.email}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{translation.users.roles}</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{translation.users.editUser}</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{translation.users.deleteUser}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <span key={role.id} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {currentUser.permissions.includes(getStringPermission({ action: 'update', feature: 'user' })) && (
                        <button
                          type="button"
                          onClick={() => handleEdit({ user })}
                          className="px-3 py-1 rounded inline-flex items-center gap-1 transition bg-blue-100 text-blue-700 hover:enabled:bg-blue-200 disabled:opacity-80 disabled:cursor-not-allowed"
                        >
                          <Pencil size={16} />
                          {translation.users.edit}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {currentUser.permissions.includes(getStringPermission({ action: 'delete', feature: 'user' })) && (
                        <button
                          type="button"
                          onClick={() => handleDelete({ user })}
                          className="px-3 py-1 rounded inline-flex items-center gap-1 transition bg-red-100 text-red-700 hover:enabled:bg-red-200 disabled:opacity-80 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                          {translation.users.delete}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
