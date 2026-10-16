import { TypeAudienceWithOptionalId } from '@ab-tester/constants/types/audience';
import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from '../[audienceId]/clientPage';

const getAudienceInitialData = async ({ tenantId, cloneFrom }: { tenantId: number; cloneFrom: string | undefined }): Promise<TypeAudienceWithOptionalId> => {
  const fallbackValue = {
    id: undefined,
    name: 'New Audience Name',
    requirements: {
      data: {
        children: [],
        operator: 'and' as const,
      },
      type: 'node' as const,
    },
    tenantId,
  };
  if (!cloneFrom) return fallbackValue;

  const audienceResponse = await apiCaller.audiences.get({ pathParams: { audienceId: Number(cloneFrom), tenantId } });
  if (!audienceResponse.ok) return fallbackValue;

  const initialAudience = await audienceResponse.json();
  return { ...initialAudience, id: undefined };
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
  const params = await props.params;
  const tenantId = Number(params.tenantId);

  const { cloneFrom } = await props.searchParams;
  const initialAudience = await getAudienceInitialData({ cloneFrom, tenantId });

  const tenantResponse = await apiCaller.tenants.get({ pathParams: { tenantId } });
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  const tenant = await tenantResponse.json();

  const trackEventsResponse = await apiCaller.trackEvents.getAllForAudience({ pathParams: { tenantId } });
  if (!trackEventsResponse.ok) return redirect(constants.pages.tenants());
  const { trackEvents } = await trackEventsResponse.json();

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name },
        { name: 'Audiences', path: constants.pages.audiences({ tenantId }) },
        { name: 'New audience' },
      ]}
    >
      <ClientPage initialAudience={initialAudience} trackEvents={trackEvents} tenantId={tenantId} />
    </Navigation>
  );
};

export default Page;
