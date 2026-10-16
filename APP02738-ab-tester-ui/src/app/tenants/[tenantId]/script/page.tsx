import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { env } from '@/libs/env';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from './clientPage';

type Props = {
  params: Promise<{
    tenantId: string;
  }>;
};

export default async function Page({ params: promiseParams }: Props) {
  const params = await promiseParams;
  const tenantId = Number(params.tenantId);

  const tenantResponse = await apiCaller.tenants.get({ pathParams: { tenantId } });
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  const tenant = await tenantResponse.json();

  const scriptResponse = await apiCaller.scripts.get({ pathParams: { tenantId } });
  if (!scriptResponse.ok) return redirect(constants.pages.tenants());
  const script = await scriptResponse.text();

  return (
    <Navigation tenant={tenant} breadcrumb={[{ name: 'Tenants', path: constants.pages.tenants() }, { name: tenant.name }, { name: 'Campaigns' }]}>
      <ClientPage url={`${env.NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE}/public/tenants/${tenantId}/script`} script={script} />
    </Navigation>
  );
}
