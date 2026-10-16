import type { TypeTenant } from '../tenant';

export type TypeApiScripts = {
  get: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
    };
    response: string;
  };
};
