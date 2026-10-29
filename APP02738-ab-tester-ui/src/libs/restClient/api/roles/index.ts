import type { TypeApiRoles } from '@ab-tester/constants/types/api/roles';
import { fetchers } from '../../fetcher';
import { rolesUrls } from './urls';

export const roles = {
  create: async (data: TypeApiRoles['create']['request']) => {
    const response = await fetchers.post<TypeApiRoles['create']['response']>({
      body: data.body,

      url: rolesUrls.create,
    });
    return response;
  },
  delete: async (data: TypeApiRoles['delete']['request']) => {
    const response = await fetchers.delete<TypeApiRoles['delete']['response']>({
      url: rolesUrls.delete(data),
    });
    return response;
  },
  getAll: async () => {
    const response = await fetchers.get<TypeApiRoles['getAll']['response']>({
      url: rolesUrls.getAll,
    });
    return response;
  },
  update: async (data: TypeApiRoles['update']['request']) => {
    const response = await fetchers.put<TypeApiRoles['update']['response']>({
      body: data.body,

      url: rolesUrls.update(data),
    });
    return response;
  },
};
