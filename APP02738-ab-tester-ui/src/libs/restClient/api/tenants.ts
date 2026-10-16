import type { TypeApiTenants } from '@ab-tester/constants/types/api/tenants';
import { fetchers } from '../fetcher';

export const tenants = {
  create: async (data: TypeApiTenants['create']['request']) => {
    const response = await fetchers.post<TypeApiTenants['create']['response']>({
      body: data.body,
      url: '/tenants',
    });
    return response;
  },
  delete: async (data: TypeApiTenants['delete']['request']) => {
    const response = await fetchers.delete<TypeApiTenants['delete']['response']>({
      url: `/tenants/${data.pathParams.tenantId}`,
    });
    return response;
  },
  get: async (data: TypeApiTenants['get']['request']) => {
    const response = await fetchers.get<TypeApiTenants['get']['response']>({
      url: `/tenants/${data.pathParams.tenantId}`,
    });
    return response;
  },
  getAll: async () => {
    const response = await fetchers.get<TypeApiTenants['getAll']['response']>({
      url: '/tenants',
    });
    return response;
  },
  update: async (data: TypeApiTenants['update']['request']) => {
    const response = await fetchers.put<TypeApiTenants['update']['response']>({
      body: data.body,
      url: `/tenants/${data.pathParams.tenantId}`,
    });
    return response;
  },
};
