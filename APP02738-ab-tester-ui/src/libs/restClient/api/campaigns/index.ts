import type { TypeApiCampaigns } from '@ab-tester/constants/types/api/campaigns';
import { fetchers } from '../../fetcher';
import { campaignsUrls } from './urls';

export const campaigns = {
  copy: async (data: TypeApiCampaigns['copy']['request']) => {
    const response = await fetchers.post<TypeApiCampaigns['copy']['response']>({
      body: data.body,
      url: campaignsUrls.copy(data),
    });
    return response;
  },
  create: async (data: TypeApiCampaigns['create']['request']) => {
    const response = await fetchers.post<TypeApiCampaigns['create']['response']>({
      body: data.body,

      url: campaignsUrls.create(data),
    });
    return response;
  },
  delete: async (data: TypeApiCampaigns['delete']['request']) => {
    const response = await fetchers.delete<TypeApiCampaigns['delete']['response']>({
      url: campaignsUrls.delete(data),
    });
    return response;
  },
  get: async (data: TypeApiCampaigns['get']['request']) => {
    const response = await fetchers.get<TypeApiCampaigns['get']['response']>({
      url: campaignsUrls.get(data),
    });
    return response;
  },
  getAllForExecutionGroup: async (data: TypeApiCampaigns['getAllForExecutionGroup']['request']) => {
    const response = await fetchers.get<TypeApiCampaigns['getAllForExecutionGroup']['response']>({
      url: campaignsUrls.getAllForExecutionGroup(data),
    });
    return response;
  },
  getMany: async (data: TypeApiCampaigns['getMany']['request']) => {
    const response = await fetchers.get<TypeApiCampaigns['getMany']['response']>({
      queryParams: data.queryParams,
      url: campaignsUrls.getMany(data),
    });
    return response;
  },
  update: async (data: TypeApiCampaigns['update']['request']) => {
    const response = await fetchers.put<TypeApiCampaigns['update']['response']>({
      body: data.body,

      url: campaignsUrls.update(data),
    });
    return response;
  },
};
