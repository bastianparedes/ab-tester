import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from './clientPage';

type PageProps = {
  params: Promise<{
    tenantId: string;
    lifecycleHookId: string;
  }>;
};
export default async function Page({ params }: PageProps) {
  const { tenantId: tenantIdParam, lifecycleHookId: lifecycleHookIdParam } = await params;
  const tenantId = Number(tenantIdParam);
  const lifecycleHookId = Number(lifecycleHookIdParam);

  if (!Number.isInteger(tenantId) || tenantId < 1 || !Number.isInteger(lifecycleHookId) || lifecycleHookId < 1) {
    redirect(constants.pages.tenants());
  }

  const tenantResponse = await apiCaller.tenants.get({ pathParams: { tenantId } });
  if (!tenantResponse.ok) redirect(constants.pages.tenants());
  const tenant = await tenantResponse.json();

  const lifecycleHookResponse = await apiCaller.lifecycleHooks.get({ pathParams: { lifecycleHookId, tenantId } });
  if (!lifecycleHookResponse.ok) redirect(constants.pages.lifecycleHooks({ tenantId }));
  const { lifecycleHook } = await lifecycleHookResponse.json();

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name, path: constants.pages.tenant({ tenantId }) },
        { name: 'Lifecycle hooks', path: constants.pages.lifecycleHooks({ tenantId }) },
        { name: lifecycleHook.name },
      ]}
    >
      <ClientPage
        tenantId={tenantId}
        initialLifecycleHook={{
          id: lifecycleHook.id,
          javascript: lifecycleHook.javascript,
          name: lifecycleHook.name,
          status: lifecycleHook.status,
          tenantId: lifecycleHook.tenantId,
          trigger: lifecycleHook.option,
        }}
      />
    </Navigation>
  );
}
