import type { TypeApiScripts } from '@ab-tester/constants/types/api/scripts';
import { fetchers } from '../fetcher';

export const scripts = {
  get: async (data: TypeApiScripts['get']['request']) => {
    const response = await fetchers.get<TypeApiScripts['get']['response']>({
      url: `/public/tenants/${data.pathParams.tenantId}/script`,
    });
    return response;
  },
};
