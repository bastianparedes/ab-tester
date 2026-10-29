import type { TypeTenant, TypeTenantUpdatable } from '@ab-tester/constants/types/tenant';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import db from './postgres/client';
import * as schema from './postgres/schema';

@Injectable()
export class TenantRepository {
  create = async ({ name, description, domain }: TypeTenantUpdatable) => {
    const [results] = await db
      .insert(schema.tenants)
      .values({
        description,
        domain,
        name,
      })
      .returning();
    return results;
  };

  update = async ({ tenantId, values }: { tenantId: TypeTenant['id']; values: TypeTenantUpdatable }) => {
    const [result] = await db
      .update(schema.tenants)
      .set({
        description: values.description,
        domain: values.domain,
        name: values.name,
      })
      .where(eq(schema.tenants.id, tenantId))
      .returning();
    return result;
  };

  get = async ({ tenantId }: { tenantId: number }) => {
    const tenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.id, tenantId),
    });
    return tenant;
  };

  getAll = async () => {
    const tenants = await db.select().from(schema.tenants);
    return tenants;
  };

  remove = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const [result] = await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId)).returning();
    return result;
  };
}
