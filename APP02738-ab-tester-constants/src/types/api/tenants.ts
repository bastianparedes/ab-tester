import type { TypeTenant } from '../tenant';

export type TypeApiTenants = {
  getAll: {
    request: never;
    response: TypeTenant[];
  };
  get: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
    };
    response: TypeTenant;
  };
  create: {
    request: {
      body: {
        name: TypeTenant['name'];
        description: TypeTenant['description'];
        domain: TypeTenant['domain'];
      };
    };
    response: TypeTenant;
  };
  update: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      body: {
        name: TypeTenant['name'];
        description: TypeTenant['description'];
        domain: TypeTenant['domain'];
      };
    };
    response: TypeTenant;
  };
  delete: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
    };
    response: TypeTenant;
  };
};
