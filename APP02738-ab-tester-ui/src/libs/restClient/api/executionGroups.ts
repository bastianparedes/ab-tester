import type { TypeApiExecutionGroups } from '@ab-tester/constants/types/api/executionGroups';
import { fetchers } from '../fetcher';

export const executionGroups = {
  create: async (data: TypeApiExecutionGroups['create']['request']) => {
    const response = await fetchers.post<TypeApiExecutionGroups['create']['response']>({
      body: data.body,

      url: `/tenants/${data.pathParams.tenantId}/execution-groups`,
    });
    return response;
  },
  delete: async (data: TypeApiExecutionGroups['delete']['request']) => {
    const response = await fetchers.delete<TypeApiExecutionGroups['delete']['response']>({
      url: `/tenants/${data.pathParams.tenantId}/execution-groups/${data.pathParams.executionGroupId}`,
    });
    return response;
  },
  get: async (data: TypeApiExecutionGroups['get']['request']) => {
    const response = await fetchers.get<TypeApiExecutionGroups['get']['response']>({
      url: `/tenants/${data.pathParams.tenantId}/execution-groups/${data.pathParams.executionGroupId}`,
    });
    return response;
  },
  getMany: async (data: TypeApiExecutionGroups['getMany']['request']) => {
    const response = await fetchers.get<TypeApiExecutionGroups['getMany']['response']>({
      queryParams: data.queryParams,
      url: `/tenants/${data.pathParams.tenantId}/execution-groups`,
    });
    return response;
  },
  update: async (data: TypeApiExecutionGroups['update']['request']) => {
    const response = await fetchers.put<TypeApiExecutionGroups['update']['response']>({
      body: data.body,

      url: `/tenants/${data.pathParams.tenantId}/execution-groups/${data.pathParams.executionGroupId}`,
    });
    return response;
  },
};
