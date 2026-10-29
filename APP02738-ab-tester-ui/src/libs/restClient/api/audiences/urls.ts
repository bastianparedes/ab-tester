import type { TypeApiAudiences } from '@ab-tester/constants/types/api/audiences';

const prefix = '/ab-test';

export const audiencesUrls = {
  copy: (data: TypeApiAudiences['copy']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/audiences/${data.pathParams.audienceId}/copy`,
  create: (data: TypeApiAudiences['create']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/audiences`,
  delete: (data: TypeApiAudiences['delete']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/audiences/${data.pathParams.audienceId}`,
  get: (data: TypeApiAudiences['get']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/audiences/${data.pathParams.audienceId}`,
  getAllForCampaign: (data: TypeApiAudiences['getAllForCampaign']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/audiences/getAllForCampaign`,
  getMany: (data: TypeApiAudiences['getMany']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/audiences`,
  update: (data: TypeApiAudiences['update']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/audiences/${data.pathParams.audienceId}`,
};
