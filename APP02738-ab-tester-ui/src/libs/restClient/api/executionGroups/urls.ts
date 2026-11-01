import type { TypeApiExecutionGroups } from '@ab-tester/constants/types/api/executionGroups';

const prefix = '/ab-test';

export const executionGroupsUrls = {
  copy: (data: TypeApiExecutionGroups['copy']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/execution-groups/${data.pathParams.executionGroupId}/copy`,
  create: (data: TypeApiExecutionGroups['create']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/execution-groups`,
  delete: (data: TypeApiExecutionGroups['delete']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/execution-groups/${data.pathParams.executionGroupId}`,
  get: (data: TypeApiExecutionGroups['get']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/execution-groups/${data.pathParams.executionGroupId}`,
  getMany: (data: TypeApiExecutionGroups['getMany']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/execution-groups`,
  update: (data: TypeApiExecutionGroups['update']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/execution-groups/${data.pathParams.executionGroupId}`,
};
