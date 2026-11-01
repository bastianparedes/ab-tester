import type { TypeApiLifecycleHooks } from '@ab-tester/constants/types/api/lifecycleHooks';

const prefix = '/ab-test';

export const lifecycleHooksUrls = {
  copy: (data: TypeApiLifecycleHooks['copy']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/lifecycle-hooks/${data.pathParams.lifecycleHookId}/copy`,
  create: (data: TypeApiLifecycleHooks['create']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/lifecycle-hooks`,
  delete: (data: TypeApiLifecycleHooks['delete']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
  get: (data: TypeApiLifecycleHooks['get']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
  getMany: (data: TypeApiLifecycleHooks['getMany']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/lifecycle-hooks`,
  update: (data: TypeApiLifecycleHooks['update']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
};
