import type { TypeApiCampaigns } from '@ab-tester/constants/types/api/campaigns';

const prefix = '/ab-test';

export const campaignsUrls = {
  copy: (data: TypeApiCampaigns['copy']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/campaigns/${data.pathParams.campaignId}/copy`,
  create: (data: TypeApiCampaigns['create']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/campaigns`,
  delete: (data: TypeApiCampaigns['delete']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/campaigns/${data.pathParams.campaignId}`,
  get: (data: TypeApiCampaigns['get']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/campaigns/${data.pathParams.campaignId}`,
  getAllForExecutionGroup: (data: TypeApiCampaigns['getAllForExecutionGroup']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/campaigns/getAllForExecutionGroup`,
  getMany: (data: TypeApiCampaigns['getMany']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/campaigns`,
  update: (data: TypeApiCampaigns['update']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/campaigns/${data.pathParams.campaignId}`,
};
