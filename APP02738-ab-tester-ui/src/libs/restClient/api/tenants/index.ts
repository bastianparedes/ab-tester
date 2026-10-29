import type { TypeApiTenants } from '@ab-tester/constants/types/api/tenants';
import { fetchers } from '../../fetcher';
import { tenantsUrls } from './urls';

export const tenants = {
  create: async (data: TypeApiTenants['create']['request']) => {
    const response = await fetchers.post<TypeApiTenants['create']['response']>({
      body: data.body,
      url: tenantsUrls.create,
    });
    return response;
  },
  delete: async (data: TypeApiTenants['delete']['request']) => {
    const response = await fetchers.delete<TypeApiTenants['delete']['response']>({
      url: tenantsUrls.delete(data),
    });
    return response;
  },
  get: async (data: TypeApiTenants['get']['request']) => {
    const response = await fetchers.get<TypeApiTenants['get']['response']>({
      url: tenantsUrls.get(data),
    });
    return response;
  },
  getAll: async () => {
    const response = await fetchers.get<TypeApiTenants['getAll']['response']>({
      url: tenantsUrls.getAll,
    });
    return response;
  },
  update: async (data: TypeApiTenants['update']['request']) => {
    const response = await fetchers.put<TypeApiTenants['update']['response']>({
      body: data.body,
      url: tenantsUrls.update(data),
    });
    return response;
  },
};
