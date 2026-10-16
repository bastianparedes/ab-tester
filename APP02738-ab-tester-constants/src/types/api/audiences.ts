import type { TypeAudience, TypeAudienceForCampaign, TypeAudienceForMenu, TypeAudienceWithOptionalId, TypeOrderAudiencesBy } from '../audience';
import type { TypeDirection } from '../constants';
import type { TypeTenant } from '../tenant';

export type TypeApiAudiences = {
  get: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; audienceId: TypeAudience['id'] };
    };
    response: TypeAudience;
  };
  getMany: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      queryParams: {
        textSearch: string;
        orderBy: TypeOrderAudiencesBy;
        orderDirection: TypeDirection;
        page: number;
        quantity: number;
      };
    };
    response: {
      audiences: TypeAudienceForMenu[];
      count: number;
    };
  };
  getAllForCampaign: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
    };
    response: {
      audiences: TypeAudienceForCampaign[];
    };
  };
  create: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      body: Omit<TypeAudienceWithOptionalId, 'id'>;
    };
    response: Record<string, never>;
  };
  update: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; audienceId: TypeAudience['id'] };
      body: TypeAudienceWithOptionalId;
    };
    response: Record<string, never>;
  };
  delete: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; audienceId: TypeAudience['id'] };
    };
    response: Record<string, never>;
  };
};
