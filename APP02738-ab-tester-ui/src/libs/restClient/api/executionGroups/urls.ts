import type { TypeApiExecutionGroups } from '@ab-tester/constants/types/api/executionGroups';

const prefix = '/ab-test';

export const executionGroupsUrls = {
  copy: (data: TypeApiExecutionGroups['copy']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/execution-groups/${data.pathParams.executionGroupId}/copy`,
  create: (data: TypeApiExecutionGroups['create']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/execution-groups`,
  delete: (data: TypeApiExecutionGroups['delete']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/execution-groups/${data.pathParams.executionGroupId}`,
  get: (data: TypeApiExecutionGroups['get']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/execution-groups/${data.pathParams.executionGroupId}`,
  getMany: (data: TypeApiExecutionGroups['getMany']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/execution-groups`,
  update: (data: TypeApiExecutionGroups['update']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/execution-groups/${data.pathParams.executionGroupId}`,
};
