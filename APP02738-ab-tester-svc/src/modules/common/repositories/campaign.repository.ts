import type { TypeCampaign, TypeCampaignUpdatable, TypeOrderCampaignsBy } from '@ab-tester/constants/types/campaign';
import type { TypeDirection } from '@ab-tester/constants/types/constants';
import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { TypeUser } from '@ab-tester/constants/types/user';
import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { copyCampaignInTransaction } from './copyCampaignInTransaction';
import db from './postgres/client';
import * as schema from './postgres/schema';

@Injectable()
export class CampaignRepository {
  copy = async ({
    campaignId,
    sourceTenantId,
    targetTenantId,
    userId,
  }: {
    campaignId: TypeCampaign['id'];
    sourceTenantId: TypeTenant['id'];
    targetTenantId: TypeTenant['id'];
    userId: TypeUser['id'];
  }) =>
    db.transaction(async (tx) => {
      const campaign = await tx.query.campaigns.findFirst({
        where: and(eq(schema.campaigns.tenantId, sourceTenantId), eq(schema.campaigns.id, campaignId)),
      });
      if (!campaign) throw new NotFoundException();

      return copyCampaignInTransaction({ campaign, sourceTenantId, targetTenantId, tx, userId });
    });

  create = async ({ tenantId, values, userId }: { tenantId: Exclude<TypeCampaign['tenantId'], undefined>; values: TypeCampaignUpdatable; userId: TypeUser['id'] }) => {
    const result = await db
      .insert(schema.campaigns)
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
    campaignId,
    updates,
    userId,
  }: {
    tenantId: TypeTenant['id'];
    campaignId: TypeCampaign['id'];
    updates: TypeCampaignUpdatable;
    userId: TypeUser['id'];
  }) => {
    const result = await db
      .update(schema.campaigns)
      .set({ ...updates, updatedBy: userId })
      .where(and(eq(schema.campaigns.tenantId, tenantId), eq(schema.campaigns.id, campaignId)))
      .returning();
    return result;
  };

  remove = async ({ tenantId, campaignId }: { tenantId: TypeTenant['id']; campaignId: TypeCampaign['id'] }) => {
    const [result] = await db
      .delete(schema.campaigns)
      .where(and(eq(schema.campaigns.tenantId, tenantId), eq(schema.campaigns.id, campaignId)))
      .returning();
    return result;
  };

  getMany = async ({
    tenantId,
    params: { statusList, textSearch, quantity, page, orderDirection, orderBy },
  }: {
    tenantId: TypeTenant['id'];
    params: {
      statusList: TypeCampaign['status'][];
      textSearch: string;
      quantity: number;
      page: number;
      orderDirection: TypeDirection;
      orderBy: TypeOrderCampaignsBy;
    };
  }) => {
    const sort = {
      asc,
      desc,
    }[orderDirection];

    const treatedTextSearch = `%${textSearch.trim()}%`;

    const campaigns = await db
      .select({
        createdAt: schema.campaigns.createdAt,
        executionGroup: schema.executionGroups,
        executionGroupId: schema.campaigns.executionGroupId,
        id: schema.campaigns.id,
        name: schema.campaigns.name,
        status: schema.campaigns.status,
        tenantId: schema.campaigns.tenantId,
        updatedAt: schema.campaigns.updatedAt,
      })
      .from(schema.campaigns)
      .leftJoin(schema.executionGroups, eq(schema.campaigns.executionGroupId, schema.executionGroups.id))
      .where(
        and(
          eq(schema.campaigns.tenantId, tenantId),
          or(
            ilike(schema.campaigns.name, treatedTextSearch),
            sql`${schema.campaigns.triggers}::text ILIKE ${treatedTextSearch}`,
            sql`${schema.campaigns.requirements}::text ILIKE ${treatedTextSearch}`,
            sql`${schema.campaigns.variations}::text ILIKE ${treatedTextSearch}`,
          ),
          inArray(schema.campaigns.status, statusList),
        ),
      )
      .orderBy(sort(schema.campaigns[orderBy]))
      .limit(quantity)
      .offset(page * quantity);

    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.campaigns)
      .where(
        and(
          eq(schema.campaigns.tenantId, tenantId),
          or(
            ilike(schema.campaigns.name, treatedTextSearch),
            sql`${schema.campaigns.triggers}::text ILIKE ${treatedTextSearch}`,
            sql`${schema.campaigns.requirements}::text ILIKE ${treatedTextSearch}`,
            sql`${schema.campaigns.variations}::text ILIKE ${treatedTextSearch}`,
          ),
          inArray(schema.campaigns.status, statusList),
        ),
      );

    return {
      campaigns,
      count: Number(count),
    };
  };

  getAllForExecutionGroup = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const campaigns = await db.query.campaigns.findMany({
      columns: {
        requirements: false,
        triggers: false,
        variations: false,
      },
      where: eq(schema.campaigns.tenantId, tenantId),
    });
    return campaigns;
  };

  get = async ({ tenantId, campaignId }: { tenantId: TypeTenant['id']; campaignId: TypeCampaign['id'] }) =>
    await db.query.campaigns.findFirst({
      where: and(eq(schema.campaigns.tenantId, tenantId), eq(schema.campaigns.id, campaignId)),
      with: {
        executionGroup: true,
      },
    });

  getAllCampaignsForScript = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const campaigns = await db.query.campaigns.findMany({
      columns: {
        id: true,
        name: true,
        requirements: true,
        triggers: true,
        variations: true,
      },
      where: (campaign) => and(eq(campaign.tenantId, tenantId), eq(campaign.status, 'active')),
    });

    return campaigns.filter((campaign) => campaign.variations.length > 0 && campaign.triggers.length > 0);
  };
}
