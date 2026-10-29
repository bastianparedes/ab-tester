import type { TypeApiUsers } from '@ab-tester/constants/types/api/users';

const prefix = '/admin';

export const usersUrls = {
  create: `${prefix}/users`,
  delete: (data: TypeApiUsers['delete']['request']) => `${prefix}/users/${data.pathParams.userId}`,
  get: `${prefix}/users/user`,
  getAll: `${prefix}/users`,
  update: (data: TypeApiUsers['update']['request']) => `${prefix}/users/${data.pathParams.userId}`,
  updateAccount: `${prefix}/account/update-account`,
  updatePassword: `${prefix}/account/update-password`,
};
