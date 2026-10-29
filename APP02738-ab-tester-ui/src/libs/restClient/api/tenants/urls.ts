import type { TypeApiTenants } from '@ab-tester/constants/types/api/tenants';

const prefix = '/admin';

export const tenantsUrls = {
  create: `${prefix}/tenants`,
  delete: (data: TypeApiTenants['delete']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}`,
  get: (data: TypeApiTenants['get']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}`,
  getAll: `${prefix}/tenants`,
  update: (data: TypeApiTenants['update']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}`,
};
