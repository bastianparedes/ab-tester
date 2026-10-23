import type { TypeApiLifecycleHooks } from '@ab-tester/constants/types/api/lifecycleHooks';
import { fetchers } from '../fetcher';

export const lifecycleHooks = {
  copy: async (data: TypeApiLifecycleHooks['copy']['request']) => {
    const response = await fetchers.post<TypeApiLifecycleHooks['copy']['response']>({
      body: data.body,
      url: `/tenants/${data.pathParams.tenantId}/lifecycle-hooks/${data.pathParams.lifecycleHookId}/copy`,
    });
    return response;
  },
  create: async (data: TypeApiLifecycleHooks['create']['request']) => {
    const response = await fetchers.post<TypeApiLifecycleHooks['create']['response']>({
      body: data.body,
      url: `/tenants/${data.pathParams.tenantId}/lifecycle-hooks`,
    });
    return response;
  },
  delete: async (data: TypeApiLifecycleHooks['delete']['request']) => {
    const response = await fetchers.delete<TypeApiLifecycleHooks['delete']['response']>({
      url: `/tenants/${data.pathParams.tenantId}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
    });
    return response;
  },
  get: async (data: TypeApiLifecycleHooks['get']['request']) => {
    const response = await fetchers.get<TypeApiLifecycleHooks['get']['response']>({
      url: `/tenants/${data.pathParams.tenantId}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
    });
    return response;
  },
  getMany: async (data: TypeApiLifecycleHooks['getMany']['request']) => {
    const response = await fetchers.get<TypeApiLifecycleHooks['getMany']['response']>({
      queryParams: data.queryParams,
      url: `/tenants/${data.pathParams.tenantId}/lifecycle-hooks`,
    });
    return response;
  },
  update: async (data: TypeApiLifecycleHooks['update']['request']) => {
    const response = await fetchers.put<TypeApiLifecycleHooks['update']['response']>({
      body: data.body,
      url: `/tenants/${data.pathParams.tenantId}/lifecycle-hooks/${data.pathParams.lifecycleHookId}`,
    });
    return response;
  },
};
