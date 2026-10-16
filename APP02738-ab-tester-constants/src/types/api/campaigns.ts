import type { TypeCampaign, TypeCampaignForExecutionGroup, TypeCampaignForMenu, TypeCampaignWithOptionalId, TypeOrderCampaignsBy } from '../campaign';
import type { TypeDirection } from '../constants';
import type { TypeExecutionGroup } from '../executionGroup';
import type { TypeTenant } from '../tenant';

export type TypeApiCampaigns = {
  get: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; campaignId: TypeCampaign['id'] };
    };
    response: TypeCampaign & { executionGroup: TypeExecutionGroup | null };
  };
  getMany: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      queryParams: {
        textSearch: string;
        orderBy: TypeOrderCampaignsBy;
        orderDirection: TypeDirection;
        page: number;
        quantity: number;
        statusList: TypeCampaign['status'][];
      };
    };
    response: {
      campaigns: (TypeCampaignForMenu & { executionGroup: TypeExecutionGroup | null })[];
      count: number;
    };
  };
  getAllForExecutionGroup: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
    };
    response: {
      campaigns: TypeCampaignForExecutionGroup[];
    };
  };
  create: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      body: Omit<Omit<TypeCampaignWithOptionalId, 'id'>, 'executionGroupId'>;
    };
    response: Record<string, never>;
  };
  update: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; campaignId: TypeCampaign['id'] };
      body: TypeCampaignWithOptionalId;
    };
    response: Record<string, never>;
  };
  delete: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; campaignId: TypeCampaign['id'] };
    };
    response: Record<string, never>;
  };
};
