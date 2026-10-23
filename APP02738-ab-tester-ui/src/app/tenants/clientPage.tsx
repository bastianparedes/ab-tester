'use client';

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { Edit, Trash2 } from 'lucide-react';
import type React from 'react';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants, { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';

type Props = {
  initialTenants: TypeTenant[];
};

export function ClientPage({ initialTenants }: Props) {
  const user = useUser();
  const { translation } = useTranslationContext();
  const getDataFromForm = useDialogStore((state) => state.getDataFromForm);
  const confirm = useDialogStore((state) => state.confirm);

  const tenants = initialTenants.filter((tenant) => user.permissions.includes(getStringPermission({ action: 'read', feature: 'tenant', tenantId: tenant.id })));

  const getTenantFromDialog = async (initialData: { name: string; description: string; domain: string }) => {
    const data = await getDataFromForm(
      {
        title: translation.tenants.createTenantTitle,
      },
      // biome-ignore assist/source/useSortedKeys: preserve form field order
      {
        name: {
          label: translation.tenants.name,
          required: true,
          type: 'text',
          value: initialData.name,
        },
        description: {
          label: translation.tenants.description,
          type: 'textarea',
          value: initialData.description,
        },
        domain: {
          label: translation.tenants.domain,
          required: true,
          type: 'text',
          value: initialData.domain,
        },
      },
    );
    return data;
  };

  const createTenant = async () => {
    const data = await getTenantFromDialog({
      description: '',
      domain: '',
      name: '',
    });
    if (!data) return;
    const result = await apiCaller.tenants.create({
      body: {
        description: data.description,
        domain: data.domain,
        name: data.name,
      },
    });
    if (!result.ok) return;
    await result.json();
    location.reload();
  };

  const deleteTenant = async (tenant: TypeTenant, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await confirm({
      description: translation.common.deleteConfirmationDescription,
      title: translation.tenants.deleteTenantTitle.replace('{name}', tenant.name),
    });
    if (!result) return;

    const response = await apiCaller.tenants.delete({ pathParams: { tenantId: tenant.id } });
    if (response.ok) location.reload();
  };

  const editTenant = async (tenant: TypeTenant, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const data = await getDataFromForm(
      {
        title: translation.tenants.editTenantTitle,
      },
      // biome-ignore assist/source/useSortedKeys: preserve form field order
      {
        name: {
          label: translation.tenants.name,
          required: true,
          type: 'text',
          value: tenant.name,
        },
        description: {
          label: translation.tenants.description,
          type: 'textarea',
          value: tenant.description,
        },
        domain: {
          label: translation.tenants.domain,
          required: true,
          type: 'text',
          value: tenant.domain,
        },
      },
    );
    if (!data) return;

    const result = await apiCaller.tenants.update({
      body: {
        description: data.description,
        domain: data.domain,
        name: data.name,
      },
      pathParams: { tenantId: tenant.id },
    });
    if (!result.ok) return;

    await result.json();
    location.reload();
  };

  return (
    <div className="bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{translation.tenants.tenants}</h1>
          {user.permissions.includes(getStringPermission({ action: 'create', feature: 'tenant' })) && (
            <button
              type="button"
              onClick={() => createTenant()}
              className="bg-blue-600 hover:enabled:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {translation.tenants.createTenant}
            </button>
          )}
        </div>

        {tenants.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{translation.tenants.noTenants}</h3>
            <p className="text-gray-500 mb-6">{translation.tenants.noTenantsDescription}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <a
                key={tenant.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 relative group"
                href={constants.pages.campaigns({ tenantId: tenant.id })}
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  {user.permissions.includes(getStringPermission({ action: 'update', feature: 'tenant' })) && (
                    <button
                      type="button"
                      onClick={(e) => editTenant(tenant, e)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title={translation.tenants.editTenant}
                    >
                      <Edit />
                    </button>
                  )}
                  {user.permissions.includes(getStringPermission({ action: 'delete', feature: 'tenant' })) && (
                    <button
                      type="button"
                      onClick={(e) => deleteTenant(tenant, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title={translation.tenants.deleteTenant}
                    >
                      <Trash2 />
                    </button>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 pr-8">{tenant.name}</h3>
                <p className="text-sm text-blue-600 mb-3">{tenant.domain}</p>
                <p className="text-gray-600 text-sm">{tenant.description}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
