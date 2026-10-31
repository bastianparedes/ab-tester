import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage, type TypeLifecycleHook } from '../[lifecycleHookId]/clientPage';
import { createInitialLifecycleHookJavascript } from '../lifecycleHookJavascript';

type PageProps = {
  params: Promise<{
    tenantId: string;
  }>;
  searchParams: Promise<{
    cloneFrom?: string;
  }>;
};
export default async function Page({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const tenantId = Number(resolvedParams.tenantId);
  const { cloneFrom } = resolvedSearchParams;
  const lifecycleHookId = cloneFrom === undefined ? undefined : Number(cloneFrom);
  if (lifecycleHookId !== undefined && (!Number.isInteger(lifecycleHookId) || lifecycleHookId < 1)) {
    redirect(constants.pages.lifecycleHooks({ tenantId }));
  }

  const [response, cloneResponse] = await Promise.all([
    apiCaller.tenants.get({ pathParams: { tenantId } }),
    lifecycleHookId === undefined ? Promise.resolve(undefined) : apiCaller.lifecycleHooks.get({ pathParams: { lifecycleHookId, tenantId } }),
  ]);
  if (!response.ok) redirect(constants.pages.logIn());

  const tenant = await response.json();
  let initialLifecycleHook: TypeLifecycleHook = {
    javascript: createInitialLifecycleHookJavascript('scriptStart'),
    name: '',
    status: 'inactive',
    tenantId,
    trigger: 'scriptStart',
  };
  if (cloneResponse !== undefined) {
    if (!cloneResponse.ok) redirect(constants.pages.lifecycleHooks({ tenantId }));
    const { lifecycleHook } = await cloneResponse.json();
    initialLifecycleHook = {
      javascript: lifecycleHook.javascript,
      name: lifecycleHook.name,
      status: lifecycleHook.status,
      tenantId,
      trigger: lifecycleHook.option,
    };
  }

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name, path: constants.pages.tenant({ tenantId }) },
        { name: 'Lifecycle hooks', path: constants.pages.lifecycleHooks({ tenantId }) },
        { name: 'Create lifecycle hook' },
      ]}
    >
      <ClientPage tenantId={tenantId} initialLifecycleHook={initialLifecycleHook} />
    </Navigation>
  );
}
