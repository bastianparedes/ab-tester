export type TypeTenant = {
  id: number;
  name: string;
  description: string;
  domain: string;
};

export type TypeTenantUpdatable = Pick<TypeTenant, 'name' | 'description' | 'domain'>;
