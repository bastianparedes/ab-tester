import type { TypeApiTrackEvents } from '@ab-tester/constants/types/api/trackEvents';

const prefix = '/ab-test';

export const trackEventsUrls = {
  copy: (data: TypeApiTrackEvents['copy']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/track-events/${data.pathParams.trackEventId}/copy`,
  create: (data: TypeApiTrackEvents['create']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/track-events`,
  delete: (data: TypeApiTrackEvents['delete']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/track-events/${data.pathParams.trackEventId}`,
  get: (data: TypeApiTrackEvents['get']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/track-events/${data.pathParams.trackEventId}`,
  getAllForAudience: (data: TypeApiTrackEvents['getAllForAudience']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/track-events/getAllForAudience`,
  getMany: (data: TypeApiTrackEvents['getMany']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/track-events`,
  update: (data: TypeApiTrackEvents['update']['request']) => `/tenants/${data.pathParams.tenantId}${prefix}/track-events/${data.pathParams.trackEventId}`,
};
