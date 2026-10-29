import type { TypeApiAudiences } from '@ab-tester/constants/types/api/audiences';
import { fetchers } from '../../fetcher';
import { audiencesUrls } from './urls';

export const audiences = {
  copy: async (data: TypeApiAudiences['copy']['request']) => {
    const response = await fetchers.post<TypeApiAudiences['copy']['response']>({
      body: data.body,
      url: audiencesUrls.copy(data),
    });
    return response;
  },
  create: async (data: TypeApiAudiences['create']['request']) => {
    const response = await fetchers.post<TypeApiAudiences['create']['response']>({
      body: data.body,

      url: audiencesUrls.create(data),
    });
    return response;
  },
  delete: async (data: TypeApiAudiences['delete']['request']) => {
    const response = await fetchers.delete<TypeApiAudiences['delete']['response']>({
      url: audiencesUrls.delete(data),
    });
    return response;
  },
  get: async (data: TypeApiAudiences['get']['request']) => {
    const response = await fetchers.get<TypeApiAudiences['get']['response']>({
      url: audiencesUrls.get(data),
    });
    return response;
  },
  getAllForCampaign: async (data: TypeApiAudiences['getAllForCampaign']['request']) => {
    const response = await fetchers.get<TypeApiAudiences['getAllForCampaign']['response']>({
      url: audiencesUrls.getAllForCampaign(data),
    });
    return response;
  },
  getMany: async (data: TypeApiAudiences['getMany']['request']) => {
    const response = await fetchers.get<TypeApiAudiences['getMany']['response']>({
      queryParams: data.queryParams,
      url: audiencesUrls.getMany(data),
    });
    return response;
  },
  update: async (data: TypeApiAudiences['update']['request']) => {
    const response = await fetchers.put<TypeApiAudiences['update']['response']>({
      body: data.body,

      url: audiencesUrls.update(data),
    });
    return response;
  },
};
