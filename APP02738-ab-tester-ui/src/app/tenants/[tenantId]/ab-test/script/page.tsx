import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { env } from '@/libs/env';
import { apiCaller } from '@/libs/restClient';
import { scriptsUrls } from '@/libs/restClient/api/scripts/urls';
import { ClientPage } from './clientPage';

type Props = {
  params: Promise<{
    tenantId: string;
  }>;
};

export default async function Page({ params: promiseParams }: Props) {
  const params = await promiseParams;
  const tenantId = Number(params.tenantId);

  const [tenantResponse, scriptResponse] = await Promise.all([apiCaller.tenants.get({ pathParams: { tenantId } }), apiCaller.scripts.get({ pathParams: { tenantId } })]);
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  if (!scriptResponse.ok) return redirect(constants.pages.tenants());
  const [tenant, script] = await Promise.all([tenantResponse.json(), scriptResponse.text()]);

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[{ name: 'Tenants', path: constants.pages.tenants() }, { name: tenant.name, path: constants.pages.tenant({ tenantId }) }, { name: 'Campaigns' }]}
    >
      <ClientPage url={`${env.NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE}${scriptsUrls.get({ pathParams: { tenantId } })}`} script={script} />
    </Navigation>
  );
}
