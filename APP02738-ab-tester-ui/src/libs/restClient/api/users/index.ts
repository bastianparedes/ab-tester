import type { TypeApiUsers } from '@ab-tester/constants/types/api/users';
import { fetchers } from '../../fetcher';
import { usersUrls } from './urls';

export const users = {
  create: async (data: TypeApiUsers['create']['request']) => {
    const response = await fetchers.post<TypeApiUsers['create']['response']>({
      body: data.body,

      url: usersUrls.create,
    });
    return response;
  },
  delete: async (data: TypeApiUsers['delete']['request']) => {
    const response = await fetchers.delete<TypeApiUsers['delete']['response']>({
      url: usersUrls.delete(data),
    });
    return response;
  },
  get: async () => {
    const response = await fetchers.get<TypeApiUsers['get']['response']>({
      url: usersUrls.get,
    });
    return response;
  },
  getAll: async () => {
    const response = await fetchers.get<TypeApiUsers['getAll']['response']>({
      url: usersUrls.getAll,
    });
    return response;
  },
  update: async (data: TypeApiUsers['update']['request']) => {
    const response = await fetchers.put<TypeApiUsers['update']['response']>({
      body: data.body,

      url: usersUrls.update(data),
    });
    return response;
  },
  updateAccount: async (data: TypeApiUsers['updateAccount']['request']) => {
    const response = await fetchers.put<TypeApiUsers['updateAccount']['response']>({
      body: data.body,

      url: usersUrls.updateAccount,
    });
    return response;
  },
  updatePassword: async (data: TypeApiUsers['updatePassword']['request']) => {
    const response = await fetchers.put<TypeApiUsers['updatePassword']['response']>({
      body: data.body,

      url: usersUrls.updatePassword,
    });
    return response;
  },
};
