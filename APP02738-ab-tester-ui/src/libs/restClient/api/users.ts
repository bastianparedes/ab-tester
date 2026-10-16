import type { TypeApiUsers } from '@ab-tester/constants/types/api/users';
import { fetchers } from '../fetcher';

export const users = {
  create: async (data: TypeApiUsers['create']['request']) => {
    const response = await fetchers.post<TypeApiUsers['create']['response']>({
      body: data.body,

      url: '/admin/users',
    });
    return response;
  },
  delete: async (data: TypeApiUsers['delete']['request']) => {
    const response = await fetchers.delete<TypeApiUsers['delete']['response']>({
      url: `/admin/users/${data.pathParams.userId}`,
    });
    return response;
  },
  get: async () => {
    const response = await fetchers.get<TypeApiUsers['get']['response']>({
      url: `/admin/users/user`,
    });
    return response;
  },
  getAll: async () => {
    const response = await fetchers.get<TypeApiUsers['getAll']['response']>({
      url: '/admin/users',
    });
    return response;
  },
  update: async (data: TypeApiUsers['update']['request']) => {
    const response = await fetchers.put<TypeApiUsers['update']['response']>({
      body: data.body,

      url: `/admin/users/${data.pathParams.userId}`,
    });
    return response;
  },
  updateAccount: async (data: TypeApiUsers['updateAccount']['request']) => {
    const response = await fetchers.put<TypeApiUsers['updateAccount']['response']>({
      body: data.body,

      url: `/account/update-account`,
    });
    return response;
  },
  updatePassword: async (data: TypeApiUsers['updatePassword']['request']) => {
    const response = await fetchers.put<TypeApiUsers['updatePassword']['response']>({
      body: data.body,

      url: `/account/update-password`,
    });
    return response;
  },
};
