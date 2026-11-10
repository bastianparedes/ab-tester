import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from '../[executionGroupId]/clientPage';

type PageProps = {
  params: Promise<{
    tenantId: string;
  }>;
};
const Page = async (props: PageProps) => {
  const params = await props.params;
  const tenantId = Number(params.tenantId);

  const [tenantResponse, allCampaignsResponse] = await Promise.all([
    apiCaller.tenants.get({ pathParams: { tenantId } }),
    apiCaller.campaigns.getAllForExecutionGroup({ pathParams: { tenantId } }),
  ]);
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  if (!allCampaignsResponse.ok) return redirect(constants.pages.executionGroups({ tenantId }));
  const [tenant, { campaigns }] = await Promise.all([tenantResponse.json(), allCampaignsResponse.json()]);

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name, path: constants.pages.tenant({ tenantId }) },
        { name: 'Execution groups', path: constants.pages.executionGroups({ tenantId }) },
        { name: 'New execution group' },
      ]}
    >
      <ClientPage
        initialExecutionGroup={{
          id: undefined,
          name: 'New execution group name',
          onlyCampaignsPreviouslyExecuted: true,
          onlyOneCampaignPerPageLoad: true,
          status: 'inactive',
          tenantId,
          waitForEveryCampaignToBeEvaluated: true,
        }}
        initialCampaigns={[]}
        tenantId={tenantId}
        executionGroupId={undefined}
        allCampaigns={campaigns}
      />
    </Navigation>
  );
};

export default Page;
