import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from './clientPage';

type PageProps = {
  params: Promise<{
    tenantId: string;
    trackEventId: string;
  }>;
};
const Page = async (props: PageProps) => {
  const params = await props.params;
  const tenantId = Number(params.tenantId);
  const trackEventId = Number(params.trackEventId);

  const tenantResponse = await apiCaller.tenants.get({ pathParams: { tenantId } });
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  const tenant = await tenantResponse.json();

  const response = await apiCaller.trackEvents.get({ pathParams: { tenantId, trackEventId } });
  if (!response.ok) return redirect(constants.pages.trackEvents({ tenantId }));

  const { trackEvent: initialTrackEvent } = await response.json();

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name },
        { name: 'Track events', path: constants.pages.trackEvents({ tenantId }) },
        { name: initialTrackEvent.name },
      ]}
    >
      <ClientPage initialTrackEvent={initialTrackEvent} tenantId={tenantId} trackEventId={trackEventId} />
    </Navigation>
  );
};

export default Page;
