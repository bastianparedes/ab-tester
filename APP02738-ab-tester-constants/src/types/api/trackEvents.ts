import type { TypeDirection } from '../constants';
import type { TypeTenant } from '../tenant';
import type { TypeOrderTrackEventBy, TypeTrackEvent, TypeTrackEventForAudience, TypeTrackEventForMenu, TypeTrackEventUpdatable } from '../trackEvents';

export type TypeApiTrackEvents = {
  get: {
    request: {
      pathParams: { tenantId: TypeTrackEvent['tenantId']; trackEventId: TypeTrackEvent['id'] };
    };
    response: {
      trackEvent: TypeTrackEvent;
    };
  };
  getMany: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      queryParams: {
        textSearch: string;
        orderBy: TypeOrderTrackEventBy;
        orderDirection: TypeDirection;
        page: number;
        quantity: number;
        statusList: TypeTrackEvent['status'][];
      };
    };
    response: {
      trackEvents: TypeTrackEventForMenu[];
      count: number;
    };
  };
  getAllForAudience: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
    };
    response: { trackEvents: TypeTrackEventForAudience[] };
  };
  create: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      body: TypeTrackEventUpdatable;
    };
    response: Record<string, never>;
  };
  update: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; trackEventId: TypeTrackEvent['id'] };
      body: TypeTrackEventUpdatable;
    };
    response: Record<string, never>;
  };
  delete: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; trackEventId: TypeTrackEvent['id'] };
    };
    response: Record<string, never>;
  };
};
