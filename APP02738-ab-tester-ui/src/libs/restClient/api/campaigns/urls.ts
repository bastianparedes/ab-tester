import type { TypeApiCampaigns } from '@ab-tester/constants/types/api/campaigns';

const prefix = '/ab-test';

export const campaignsUrls = {
  copy: (data: TypeApiCampaigns['copy']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/campaigns/${data.pathParams.campaignId}/copy`,
  create: (data: TypeApiCampaigns['create']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/campaigns`,
  delete: (data: TypeApiCampaigns['delete']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/campaigns/${data.pathParams.campaignId}`,
  get: (data: TypeApiCampaigns['get']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/campaigns/${data.pathParams.campaignId}`,
  getAllForExecutionGroup: (data: TypeApiCampaigns['getAllForExecutionGroup']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/campaigns/getAllForExecutionGroup`,
  getMany: (data: TypeApiCampaigns['getMany']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/campaigns`,
  update: (data: TypeApiCampaigns['update']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/campaigns/${data.pathParams.campaignId}`,
};
