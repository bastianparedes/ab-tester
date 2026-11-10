import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from './clientPage';

type PageProps = {
  params: Promise<{
    tenantId: string;
    audienceId: string;
  }>;
};
const Page = async (props: PageProps) => {
  const params = await props.params;
  const tenantId = Number(params.tenantId);
  const audienceId = Number(params.audienceId);

  const [tenantResponse, audienceResponse, trackEventsResponse] = await Promise.all([
    apiCaller.tenants.get({ pathParams: { tenantId } }),
    apiCaller.audiences.get({ pathParams: { audienceId, tenantId } }),
    apiCaller.trackEvents.getAllForAudience({ pathParams: { tenantId } }),
  ]);
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  if (!audienceResponse.ok) return redirect(constants.pages.audiences({ tenantId }));
  if (!trackEventsResponse.ok) return redirect(constants.pages.tenants());
  const [tenant, initialAudience, { trackEvents }] = await Promise.all([tenantResponse.json(), audienceResponse.json(), trackEventsResponse.json()]);
  if (trackEvents.length === 0) return redirect(constants.pages.trackEvents({ tenantId }));

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name, path: constants.pages.tenant({ tenantId }) },
        { name: 'Audiences', path: constants.pages.audiences({ tenantId }) },
        { name: initialAudience.name },
      ]}
    >
      <ClientPage initialAudience={initialAudience} tenantId={tenantId} trackEvents={trackEvents} />
    </Navigation>
  );
};

export default Page;
