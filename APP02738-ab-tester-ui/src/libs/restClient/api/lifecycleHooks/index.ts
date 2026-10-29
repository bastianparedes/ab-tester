import type { TypeApiLifecycleHooks } from '@ab-tester/constants/types/api/lifecycleHooks';
import { fetchers } from '../../fetcher';
import { lifecycleHooksUrls } from './urls';

export const lifecycleHooks = {
  copy: async (data: TypeApiLifecycleHooks['copy']['request']) => {
    const response = await fetchers.post<TypeApiLifecycleHooks['copy']['response']>({
      body: data.body,
      url: lifecycleHooksUrls.copy(data),
    });
    return response;
  },
  create: async (data: TypeApiLifecycleHooks['create']['request']) => {
    const response = await fetchers.post<TypeApiLifecycleHooks['create']['response']>({
      body: data.body,
      url: lifecycleHooksUrls.create(data),
    });
    return response;
  },
  delete: async (data: TypeApiLifecycleHooks['delete']['request']) => {
    const response = await fetchers.delete<TypeApiLifecycleHooks['delete']['response']>({
      url: lifecycleHooksUrls.delete(data),
    });
    return response;
  },
  get: async (data: TypeApiLifecycleHooks['get']['request']) => {
    const response = await fetchers.get<TypeApiLifecycleHooks['get']['response']>({
      url: lifecycleHooksUrls.get(data),
    });
    return response;
  },
  getMany: async (data: TypeApiLifecycleHooks['getMany']['request']) => {
    const response = await fetchers.get<TypeApiLifecycleHooks['getMany']['response']>({
      queryParams: data.queryParams,
      url: lifecycleHooksUrls.getMany(data),
    });
    return response;
  },
  update: async (data: TypeApiLifecycleHooks['update']['request']) => {
    const response = await fetchers.put<TypeApiLifecycleHooks['update']['response']>({
      body: data.body,
      url: lifecycleHooksUrls.update(data),
    });
    return response;
  },
};
