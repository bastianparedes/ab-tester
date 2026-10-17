import type { TypeAudience, TypeAudienceUpdatable, TypeOrderAudiencesBy } from '@ab-tester/constants/types/audience';
import type { TypeDirection } from '@ab-tester/constants/types/constants';
import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { TypeUser } from '@ab-tester/constants/types/user';
import { ConflictException, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import db from './postgres/client';
import * as schema from './postgres/schema';

@Injectable()
export class AudienceRepository {
  create = async ({ tenantId, values, userId }: { tenantId: TypeAudience['tenantId']; values: TypeAudienceUpdatable; userId: TypeUser['id'] }) => {
    const result = await db
      .insert(schema.audiences)
      .values({
        ...values,
        createdBy: userId,
        tenantId,
        updatedBy: userId,
      })
      .returning();
    return result;
  };

  update = async ({
    tenantId,
    audienceId,
    updates,
    userId,
  }: {
    tenantId: TypeTenant['id'];
    audienceId: TypeAudience['id'];
    updates: TypeAudienceUpdatable;
    userId: TypeUser['id'];
  }) => {
    const result = await db
      .update(schema.audiences)
      .set({ ...updates, updatedBy: userId })
      .where(and(eq(schema.audiences.tenantId, tenantId), eq(schema.audiences.id, audienceId)))
      .returning();
    return result;
  };

  remove = async ({ tenantId, audienceId }: { tenantId: TypeTenant['id']; audienceId: TypeAudience['id'] }) => {
    const campaigns = await db
      .select({
        id: schema.campaigns.id,
      })
      .from(schema.campaigns)
      .where(sql`
        jsonb_path_exists(
          requirements,
          '$.** ? (@.type == "audience" && @.data.id == $id)',
          ${JSON.stringify({ id: audienceId })}
        )
      `)
      .limit(1);

    if (campaigns.length > 0) throw new ConflictException(`Campaigns with id ${campaigns.map((c) => c.id).join(', ')} are using this Audience`);

    const [result] = await db
      .delete(schema.audiences)
      .where(and(eq(schema.audiences.tenantId, tenantId), eq(schema.audiences.id, audienceId)))
      .returning();
    return result;
  };

  getMany = async ({
    tenantId,
    params: { textSearch, quantity, page, orderDirection, orderBy },
  }: {
    tenantId: TypeTenant['id'];
    params: {
      textSearch: string;
      quantity: number;
      page: number;
      orderDirection: TypeDirection;
      orderBy: TypeOrderAudiencesBy;
    };
  }) => {
    const sort = {
      asc,
      desc,
    }[orderDirection];

    const treatedTextSearch = `%${textSearch.trim()}%`;

    const audiences = await db
      .select({
        createdAt: schema.audiences.createdAt,
        id: schema.audiences.id,
        name: schema.audiences.name,
        tenantId: schema.audiences.tenantId,
        updatedAt: schema.audiences.updatedAt,
      })
      .from(schema.audiences)
      .where(
        and(
          eq(schema.audiences.tenantId, tenantId),
          or(ilike(schema.audiences.name, treatedTextSearch), sql`${schema.audiences.requirements}::text ILIKE ${treatedTextSearch}`),
        ),
      )
      .orderBy(sort(schema.audiences[orderBy]))
      .limit(quantity)
      .offset(page * quantity);

    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.audiences)
      .where(
        and(
          eq(schema.audiences.tenantId, tenantId),
          or(ilike(schema.audiences.name, treatedTextSearch), sql`${schema.audiences.requirements}::text ILIKE ${treatedTextSearch}`),
        ),
      );

    return {
      audiences,
      count: Number(count),
    };
  };

  getAllForCampaign = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const audiences = await db.query.audiences.findMany({
      columns: {
        id: true,
        name: true,
      },
      where: eq(schema.audiences.tenantId, tenantId),
    });
    return audiences;
  };

  get = async ({ tenantId, audienceId }: { tenantId: TypeTenant['id']; audienceId: TypeAudience['id'] }) =>
    await db.query.audiences.findFirst({
      where: and(eq(schema.audiences.tenantId, tenantId), eq(schema.audiences.id, audienceId)),
    });

  getAllAudiencesForScript = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const audiences = await db.query.audiences.findMany({
      columns: {
        id: true,
        name: true,
        requirements: true,
      },
      where: eq(schema.audiences.tenantId, tenantId),
    });
    return audiences;
  };
}
