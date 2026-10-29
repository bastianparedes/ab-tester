import type { TypeApiRoles } from '@ab-tester/constants/types/api/roles';

const prefix = '/admin';

export const rolesUrls = {
  create: `${prefix}/roles`,
  delete: (data: TypeApiRoles['delete']['request']) => `${prefix}/roles/${data.pathParams.roleId}`,
  getAll: `${prefix}/roles`,
  update: (data: TypeApiRoles['update']['request']) => `${prefix}/roles/${data.pathParams.roleId}`,
};
