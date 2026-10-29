import type { TypeApiLifecycleHooks } from '@ab-tester/constants/types/api/lifecycleHooks';

const prefix = '/ab-test';

export const lifecycleHooksUrls = {
  copy: (data: TypeApiLifecycleHooks['copy']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/lifecycle-hooks/${data.pathParams.lifecycleHookId}/copy`,
  create: (data: TypeApiLifecycleHooks['create']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/lifecycle-hooks`,
  delete: (data: TypeApiLifecycleHooks['delete']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
  get: (data: TypeApiLifecycleHooks['get']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
  getMany: (data: TypeApiLifecycleHooks['getMany']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/lifecycle-hooks`,
  update: (data: TypeApiLifecycleHooks['update']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
};
