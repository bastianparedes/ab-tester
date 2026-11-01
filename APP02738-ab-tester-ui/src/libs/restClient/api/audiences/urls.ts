import type { TypeApiAudiences } from '@ab-tester/constants/types/api/audiences';

const prefix = '/ab-test';

export const audiencesUrls = {
  copy: (data: TypeApiAudiences['copy']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/audiences/${data.pathParams.audienceId}/copy`,
  create: (data: TypeApiAudiences['create']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/audiences`,
  delete: (data: TypeApiAudiences['delete']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/audiences/${data.pathParams.audienceId}`,
  get: (data: TypeApiAudiences['get']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/audiences/${data.pathParams.audienceId}`,
  getAllForCampaign: (data: TypeApiAudiences['getAllForCampaign']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/audiences/getAllForCampaign`,
  getMany: (data: TypeApiAudiences['getMany']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/audiences`,
  update: (data: TypeApiAudiences['update']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/audiences/${data.pathParams.audienceId}`,
};
