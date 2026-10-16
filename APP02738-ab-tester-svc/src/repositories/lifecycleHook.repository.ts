import type { TypeDirection } from '@ab-tester/constants/types/constants';
import type { TypeLifecycleHook, TypeOrderLifecycleHookBy } from '@ab-tester/constants/types/lifecycleHooks';
import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import type { TypeUser } from '@ab-tester/constants/types/user';
import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import db from './postgres/client';
import * as schema from './postgres/schema';

type LifecycleHookValues = Pick<TypeLifecycleHook, 'status' | 'name' | 'option' | 'javascript'>;

@Injectable()
export class LifecycleHookRepository {
  create = async ({ tenantId, values, userId }: { tenantId: TypeTenant['id']; values: LifecycleHookValues; userId: TypeUser['id'] }) => {
    const [result] = await db
      .insert(schema.lifecycleHooks)
      .values({
        ...values,
        createdBy: userId,
        tenantId,
      })
      .returning();

    return result;
  };

  update = async ({ tenantId, lifecycleHookId, values }: { tenantId: TypeTenant['id']; lifecycleHookId: TypeLifecycleHook['id']; values: LifecycleHookValues }) => {
    const [result] = await db
      .update(schema.lifecycleHooks)
      .set(values)
      .where(and(eq(schema.lifecycleHooks.tenantId, tenantId), eq(schema.lifecycleHooks.id, lifecycleHookId)))
      .returning();

    return result;
  };

  remove = async ({ tenantId, lifecycleHookId }: { tenantId: TypeTenant['id']; lifecycleHookId: TypeLifecycleHook['id'] }) => {
    const [result] = await db
      .delete(schema.lifecycleHooks)
      .where(and(eq(schema.lifecycleHooks.tenantId, tenantId), eq(schema.lifecycleHooks.id, lifecycleHookId)))
      .returning();

    return result;
  };

  get = async ({ tenantId, lifecycleHookId }: { tenantId: TypeTenant['id']; lifecycleHookId: TypeLifecycleHook['id'] }) => {
    const result = await db.query.lifecycleHooks.findFirst({
      where: and(eq(schema.lifecycleHooks.tenantId, tenantId), eq(schema.lifecycleHooks.id, lifecycleHookId)),
    });

    return result;
  };

  getMany = async ({
    tenantId,
    params: { textSearch, quantity, page, orderDirection, orderBy, statusList },
  }: {
    tenantId: TypeTenant['id'];
    params: {
      textSearch: string;
      quantity: number;
      page: number;
      orderDirection: TypeDirection;
      orderBy: TypeOrderLifecycleHookBy;
      statusList: TypeLifecycleHook['status'][];
    };
  }) => {
    const sort = { asc, desc }[orderDirection];
    const treatedTextSearch = `%${textSearch.trim()}%`;
    const where = and(eq(schema.lifecycleHooks.tenantId, tenantId), ilike(schema.lifecycleHooks.name, treatedTextSearch), inArray(schema.lifecycleHooks.status, statusList));

    const lifecycleHooks = await db
      .select({
        createdAt: schema.lifecycleHooks.createdAt,
        id: schema.lifecycleHooks.id,
        name: schema.lifecycleHooks.name,
        option: schema.lifecycleHooks.option,
        status: schema.lifecycleHooks.status,
        tenantId: schema.lifecycleHooks.tenantId,
        updatedAt: schema.lifecycleHooks.updatedAt,
      })
      .from(schema.lifecycleHooks)
      .where(where)
      .orderBy(sort(schema.lifecycleHooks[orderBy]))
      .limit(quantity)
      .offset(page * quantity);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.lifecycleHooks).where(where);

    return { count: Number(count), lifecycleHooks };
  };

  getAllLifecycleHooksForScript = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const lifecycleHooks = await db.query.lifecycleHooks.findMany({
      columns: {
        id: true,
        javascript: true,
        name: true,
        option: true,
      },
      where: and(eq(schema.lifecycleHooks.tenantId, tenantId), eq(schema.lifecycleHooks.status, 'active')),
    });

    return lifecycleHooks;
  };
}
