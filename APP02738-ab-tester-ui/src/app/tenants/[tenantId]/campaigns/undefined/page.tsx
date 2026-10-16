import { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import commonConstants from '@/config/sharedConstants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from '../[campaignId]/clientPage';

const getCampaignInitialData = async ({ tenantId, cloneFrom }: { tenantId: number; cloneFrom: string | undefined }): Promise<TypeCampaignWithOptionalId> => {
  const fallbackValue = {
    executionGroupId: null,
    id: undefined,
    name: 'New Campaign Name',
    requirements: {
      data: {
        children: [],
        operator: 'and' as const,
      },
      type: 'node' as const,
    },
    status: commonConstants.status.active,
    tenantId,
    triggers: [],
    variations: [],
  };
  if (!cloneFrom) return fallbackValue;

  const campaignResponse = await apiCaller.campaigns.get({ pathParams: { campaignId: Number(cloneFrom), tenantId } });
  if (!campaignResponse.ok) return fallbackValue;

  const initialCampaign = await campaignResponse.json();
  return { ...initialCampaign, id: undefined };
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
  const initialCampaign = await getCampaignInitialData({ cloneFrom, tenantId });

  const tenantResponse = await apiCaller.tenants.get({ pathParams: { tenantId } });
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  const tenant = await tenantResponse.json();

  const audiencesResponse = await apiCaller.audiences.getAllForCampaign({ pathParams: { tenantId } });
  if (!audiencesResponse.ok) return redirect(constants.pages.tenants());
  const { audiences } = await audiencesResponse.json();

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name },
        { name: 'Campaigns', path: constants.pages.campaigns({ tenantId }) },
        { name: 'New campaign' },
      ]}
    >
      <ClientPage initialCampaign={initialCampaign} tenantId={tenantId} campaignId={undefined} audiences={audiences} />
    </Navigation>
  );
};

export default Page;
