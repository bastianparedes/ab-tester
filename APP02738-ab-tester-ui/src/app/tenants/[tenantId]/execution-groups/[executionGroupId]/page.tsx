import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from './clientPage';

type PageProps = {
  params: Promise<{
    tenantId: string;
    executionGroupId: string;
  }>;
};
const Page = async (props: PageProps) => {
  const params = await props.params;
  const tenantId = Number(params.tenantId);
  const executionGroupId = Number(params.executionGroupId);

  const tenantResponse = await apiCaller.tenants.get({ pathParams: { tenantId } });
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  const tenant = await tenantResponse.json();

  const executionGroupResponse = await apiCaller.executionGroups.get({ pathParams: { executionGroupId, tenantId } });
  if (!executionGroupResponse.ok) return redirect(constants.pages.executionGroups({ tenantId }));

  const { executionGroup: initialExecutionGroup, campaigns: initialCampaigns } = await executionGroupResponse.json();

  const allCampaignsResponse = await apiCaller.campaigns.getAllForExecutionGroup({ pathParams: { tenantId } });
  if (!allCampaignsResponse.ok) return redirect(constants.pages.executionGroups({ tenantId }));
  const { campaigns: allCampaigns } = await allCampaignsResponse.json();

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name },
        { name: 'Execution groups', path: constants.pages.executionGroups({ tenantId }) },
        { name: initialExecutionGroup.name },
      ]}
    >
      <ClientPage
        initialExecutionGroup={initialExecutionGroup}
        initialCampaigns={initialCampaigns}
        tenantId={tenantId}
        executionGroupId={executionGroupId}
        allCampaigns={allCampaigns}
      />
    </Navigation>
  );
};

export default Page;
