import { TypeTrackEventWithOptionalId } from '@ab-tester/constants/types/trackEvents';
import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import commonConstants from '@/config/sharedConstants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from '../[trackEventId]/clientPage';

const javascriptInitialValue = `
/* ############ THIS FUNCTION WILL BE EXECUTED MULTIPLE TIMES ############ */
/* ############ IT IS VERY IMPORTANT TO REMOVE UNUSED LISTENERS AND INTERVALS ############ */
/* ############ RESOLVE ONLY string, number, boolean, undefined ############ */
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

async () => {
  return new Promise((r) => {
    function handler(e) {
      if (e.target.id !== 'my-id') r(true);
      window.removeEventListener("click", handler);
    }
    window.addEventListener("click", handler);
  })
}
`;

const getTrackEventInitialData = async ({ tenantId, cloneFrom }: { tenantId: number; cloneFrom: string | undefined }): Promise<TypeTrackEventWithOptionalId> => {
  const fallbackValue = {
    id: undefined,
    javascript: javascriptInitialValue,
    multipleTimes: false,
    name: 'New Track Event Name',
    status: commonConstants.status.active,
    tenantId,
  };
  if (!cloneFrom) return fallbackValue;

  const response = await apiCaller.trackEvents.get({ pathParams: { tenantId, trackEventId: Number(cloneFrom) } });
  if (!response.ok) return fallbackValue;

  const { trackEvent } = await response.json();
  return { ...trackEvent, id: undefined };
};

type PageProps = {
  params: Promise<{
    tenantId: string;
  }>;
  searchParams: Promise<{
    cloneFrom?: string;
  }>;
};
const Page = async (props: PageProps) => {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const tenantId = Number(params.tenantId);

  const { cloneFrom } = searchParams;

  const [initialTrackEvent, tenantResponse] = await Promise.all([getTrackEventInitialData({ cloneFrom, tenantId }), apiCaller.tenants.get({ pathParams: { tenantId } })]);
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  const tenant = await tenantResponse.json();

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name, path: constants.pages.tenant({ tenantId }) },
        { name: 'Track events', path: constants.pages.trackEvents({ tenantId }) },
        { name: 'New track event' },
      ]}
    >
      <ClientPage initialTrackEvent={initialTrackEvent} tenantId={tenantId} trackEventId={undefined} />
    </Navigation>
  );
};

export default Page;
