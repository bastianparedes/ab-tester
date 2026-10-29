import type { TypeApiTrackEvents } from '@ab-tester/constants/types/api/trackEvents';

const prefix = '/ab-test';

export const trackEventsUrls = {
  copy: (data: TypeApiTrackEvents['copy']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/track-events/${data.pathParams.trackEventId}/copy`,
  create: (data: TypeApiTrackEvents['create']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/track-events`,
  delete: (data: TypeApiTrackEvents['delete']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/track-events/${data.pathParams.trackEventId}`,
  get: (data: TypeApiTrackEvents['get']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/track-events/${data.pathParams.trackEventId}`,
  getAllForAudience: (data: TypeApiTrackEvents['getAllForAudience']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/track-events/getAllForAudience`,
  getMany: (data: TypeApiTrackEvents['getMany']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/track-events`,
  update: (data: TypeApiTrackEvents['update']['request']) => `${prefix}/tenants/${data.pathParams.tenantId}/track-events/${data.pathParams.trackEventId}`,
};
