import type { TypeApiScripts } from '@ab-tester/constants/types/api/scripts';
import { fetchers } from '../../fetcher';
import { scriptsUrls } from './urls';

export const scripts = {
  get: async (data: TypeApiScripts['get']['request']) => {
    const response = await fetchers.get<TypeApiScripts['get']['response']>({
      url: scriptsUrls.get(data),
    });
    return response;
  },
};
