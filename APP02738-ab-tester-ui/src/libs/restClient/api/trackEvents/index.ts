import type { TypeApiTrackEvents } from '@ab-tester/constants/types/api/trackEvents';
import { fetchers } from '../../fetcher';
import { trackEventsUrls } from './urls';

export const trackEvents = {
  copy: async (data: TypeApiTrackEvents['copy']['request']) => {
    const response = await fetchers.post<TypeApiTrackEvents['copy']['response']>({
      body: data.body,
      url: trackEventsUrls.copy(data),
    });
    return response;
  },
  create: async (data: TypeApiTrackEvents['create']['request']) => {
    const response = await fetchers.post<TypeApiTrackEvents['create']['response']>({
      body: data.body,
      url: trackEventsUrls.create(data),
    });
    return response;
  },
  delete: async (data: TypeApiTrackEvents['delete']['request']) => {
    const response = await fetchers.delete<TypeApiTrackEvents['delete']['response']>({
      url: trackEventsUrls.delete(data),
    });
    return response;
  },
  get: async (data: TypeApiTrackEvents['get']['request']) => {
    const response = await fetchers.get<TypeApiTrackEvents['get']['response']>({
      url: trackEventsUrls.get(data),
    });
    return response;
  },
  getAllForAudience: async (data: TypeApiTrackEvents['getAllForAudience']['request']) => {
    const response = await fetchers.get<TypeApiTrackEvents['getAllForAudience']['response']>({
      url: trackEventsUrls.getAllForAudience(data),
    });
    return response;
  },
  getMany: async (data: TypeApiTrackEvents['getMany']['request']) => {
    const response = await fetchers.get<TypeApiTrackEvents['getMany']['response']>({
      queryParams: data.queryParams,
      url: trackEventsUrls.getMany(data),
    });
    return response;
  },
  update: async (data: TypeApiTrackEvents['update']['request']) => {
    const response = await fetchers.put<TypeApiTrackEvents['update']['response']>({
      body: data.body,
      url: trackEventsUrls.update(data),
    });
    return response;
  },
};
