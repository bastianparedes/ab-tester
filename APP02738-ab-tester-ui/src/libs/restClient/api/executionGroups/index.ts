import type { TypeApiExecutionGroups } from '@ab-tester/constants/types/api/executionGroups';
import { fetchers } from '../../fetcher';
import { executionGroupsUrls } from './urls';

export const executionGroups = {
  copy: async (data: TypeApiExecutionGroups['copy']['request']) => {
    const response = await fetchers.post<TypeApiExecutionGroups['copy']['response']>({
      body: data.body,
      url: executionGroupsUrls.copy(data),
    });
    return response;
  },
  create: async (data: TypeApiExecutionGroups['create']['request']) => {
    const response = await fetchers.post<TypeApiExecutionGroups['create']['response']>({
      body: data.body,

      url: executionGroupsUrls.create(data),
    });
    return response;
  },
  delete: async (data: TypeApiExecutionGroups['delete']['request']) => {
    const response = await fetchers.delete<TypeApiExecutionGroups['delete']['response']>({
      url: executionGroupsUrls.delete(data),
    });
    return response;
  },
  get: async (data: TypeApiExecutionGroups['get']['request']) => {
    const response = await fetchers.get<TypeApiExecutionGroups['get']['response']>({
      url: executionGroupsUrls.get(data),
    });
    return response;
  },
  getMany: async (data: TypeApiExecutionGroups['getMany']['request']) => {
    const response = await fetchers.get<TypeApiExecutionGroups['getMany']['response']>({
      queryParams: data.queryParams,
      url: executionGroupsUrls.getMany(data),
    });
    return response;
  },
  update: async (data: TypeApiExecutionGroups['update']['request']) => {
    const response = await fetchers.put<TypeApiExecutionGroups['update']['response']>({
      body: data.body,

      url: executionGroupsUrls.update(data),
    });
    return response;
  },
};
