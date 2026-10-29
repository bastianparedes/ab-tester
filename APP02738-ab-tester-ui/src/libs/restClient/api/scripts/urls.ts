import type { TypeApiScripts } from '@ab-tester/constants/types/api/scripts';

const prefix = '/ab-test';

export const scriptsUrls = {
  get: (data: TypeApiScripts['get']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/script`,
};
