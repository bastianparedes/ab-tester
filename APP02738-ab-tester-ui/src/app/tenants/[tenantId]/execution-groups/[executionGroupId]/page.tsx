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

  const [tenantResponse, executionGroupResponse, allCampaignsResponse] = await Promise.all([
    apiCaller.tenants.get({ pathParams: { tenantId } }),
    apiCaller.executionGroups.get({ pathParams: { executionGroupId, tenantId } }),
    apiCaller.campaigns.getAllForExecutionGroup({ pathParams: { tenantId } }),
  ]);
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  if (!executionGroupResponse.ok) return redirect(constants.pages.executionGroups({ tenantId }));
  if (!allCampaignsResponse.ok) return redirect(constants.pages.executionGroups({ tenantId }));
  const [tenant, { executionGroup: initialExecutionGroup, campaigns: initialCampaigns }, { campaigns: allCampaigns }] = await Promise.all([
    tenantResponse.json(),
    executionGroupResponse.json(),
    allCampaignsResponse.json(),
  ]);

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[
        { name: 'Tenants', path: constants.pages.tenants() },
        { name: tenant.name, path: constants.pages.tenant({ tenantId }) },
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
