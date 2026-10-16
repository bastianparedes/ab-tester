import type { TypeCampaign, TypeCampaignForExecutionGroup } from '../campaign';
import type { TypeDirection } from '../constants';
import type { TypeExecutionGroup, TypeExecutionGroupForMenu, TypeOrderExecutionGroupsBy } from '../executionGroup';
import type { TypeTenant } from '../tenant';

export type TypeApiExecutionGroups = {
  get: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; executionGroupId: TypeExecutionGroup['id'] };
    };
    response: {
      executionGroup: TypeExecutionGroup;
      campaigns: TypeCampaignForExecutionGroup[];
    };
  };
  getMany: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      queryParams: {
        textSearch: string;
        orderBy: TypeOrderExecutionGroupsBy;
        orderDirection: TypeDirection;
        page: number;
        quantity: number;
        statusList: TypeExecutionGroup['status'][];
      };
    };
    response: {
      executionGroups: (TypeExecutionGroupForMenu & { campaignsCount: number })[];
      count: number;
    };
  };
  create: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      body: Omit<Omit<Omit<Omit<TypeExecutionGroup, 'id'>, 'createdAt'>, 'updatedAt'>, 'tenantId'> & { campaignIds: TypeCampaign['id'][] };
    };
    response: Record<string, never>;
  };
  update: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; executionGroupId: TypeExecutionGroup['id'] };
      body: Omit<Omit<Omit<Omit<TypeExecutionGroup, 'id'>, 'createdAt'>, 'updatedAt'>, 'tenantId'> & { campaignIds: TypeCampaign['id'][] };
    };
    response: Record<string, never>;
  };
  delete: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; executionGroupId: TypeExecutionGroup['id'] };
    };
    response: Record<string, never>;
  };
};
