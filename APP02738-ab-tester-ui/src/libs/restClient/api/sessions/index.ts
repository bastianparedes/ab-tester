import type { TypeApiSessions } from '@ab-tester/constants/types/api/sessions';
import { fetchers } from '../../fetcher';
import { sessionsUrls } from './urls';

export const sessions = {
  logIn: async (data: TypeApiSessions['logIn']['request']) => {
    const response = await fetchers.post<TypeApiSessions['logIn']['response']>({
      body: data.body,

      url: sessionsUrls.logIn,
    });
    return response;
  },
  logOut: async () => {
    const response = await fetchers.get<TypeApiSessions['logOut']['response']>({
      url: sessionsUrls.logOut,
    });
    return response;
  },
  refreshAccessToken: async () => {
    const response = await fetchers.get<TypeApiSessions['refresh']['response']>({
      url: sessionsUrls.refreshAccessToken,
    });
    return response;
  },
};
