import type { TypeApiAudiences } from '@ab-tester/constants/types/api/audiences';
import { fetchers } from '../fetcher';

export const audiences = {
  create: async (data: TypeApiAudiences['create']['request']) => {
    const response = await fetchers.post<TypeApiAudiences['create']['response']>({
      body: data.body,

      url: `/tenants/${data.pathParams.tenantId}/audiences`,
    });
    return response;
  },
  delete: async (data: TypeApiAudiences['delete']['request']) => {
    const response = await fetchers.delete<TypeApiAudiences['delete']['response']>({
      url: `/tenants/${data.pathParams.tenantId}/audiences/${data.pathParams.audienceId}`,
    });
    return response;
  },
  get: async (data: TypeApiAudiences['get']['request']) => {
    const response = await fetchers.get<TypeApiAudiences['get']['response']>({
      url: `/tenants/${data.pathParams.tenantId}/audiences/${data.pathParams.audienceId}`,
    });
    return response;
  },
  getAllForCampaign: async (data: TypeApiAudiences['getAllForCampaign']['request']) => {
    const response = await fetchers.get<TypeApiAudiences['getAllForCampaign']['response']>({
      url: `/tenants/${data.pathParams.tenantId}/audiences/getAllForCampaign`,
    });
    return response;
  },
  getMany: async (data: TypeApiAudiences['getMany']['request']) => {
    const response = await fetchers.get<TypeApiAudiences['getMany']['response']>({
      queryParams: data.queryParams,
      url: `/tenants/${data.pathParams.tenantId}/audiences`,
    });
    return response;
  },
  update: async (data: TypeApiAudiences['update']['request']) => {
    const response = await fetchers.put<TypeApiAudiences['update']['response']>({
      body: data.body,

      url: `/tenants/${data.pathParams.tenantId}/audiences/${data.pathParams.audienceId}`,
    });
    return response;
  },
};
