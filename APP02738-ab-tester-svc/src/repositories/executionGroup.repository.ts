import type { TypeCampaign, TypeOrderCampaignsBy } from '@ab-tester/constants/types/campaign';
import type { TypeDirection } from '@ab-tester/constants/types/constants';
import type { TypeExecutionGroup, TypeExecutionGroupUpdatable } from '@ab-tester/constants/types/executionGroup';
import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { TypeUser } from '@ab-tester/constants/types/user';
import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import db from './postgres/client';
import * as schema from './postgres/schema';

@Injectable()
export class ExecutionGroupRepository {
  create = async ({
    tenantId,
    values,
    campaignIds,
    userId,
  }: {
    tenantId: TypeTenant['id'];
    values: TypeExecutionGroupUpdatable;
    campaignIds: TypeCampaign['id'][];
    userId: TypeUser['id'];
  }) => {
    const result = await db.transaction(async (tx) => {
      const [result] = await tx
        .insert(schema.executionGroups)
        .values({
          ...values,
          createdBy: userId,
          tenantId,
          updatedBy: userId,
        })
        .returning();

      await tx
        .update(schema.campaigns)
        .set({
          executionGroupId: result.id,
        })
        .where(and(eq(schema.campaigns.tenantId, tenantId), inArray(schema.campaigns.id, campaignIds)));

      return result;
    });

    return result;
  };

  update = async ({
    tenantId,
    executionGroupId,
    values,
    campaignIds,
    userId,
  }: {
    tenantId: TypeTenant['id'];
    executionGroupId: TypeExecutionGroup['id'];
    values: TypeExecutionGroupUpdatable;
    campaignIds: TypeCampaign['id'][];
    userId: TypeUser['id'];
  }) => {
    const result = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(schema.executionGroups)
        .set({ ...values, updatedBy: userId })
        .where(and(eq(schema.executionGroups.tenantId, tenantId), eq(schema.executionGroups.id, executionGroupId)))
        .returning();

      const campaignIdObjects = await tx
        .select({ id: schema.campaigns.id })
        .from(schema.campaigns)
        .where(and(eq(schema.campaigns.tenantId, tenantId), eq(schema.campaigns.executionGroupId, executionGroupId)));
      const currentCampaignIdsInExecutionGroup = campaignIdObjects.map((campaign) => campaign.id);

      const campaignIdsToRemoveFromExecutionGroup = currentCampaignIdsInExecutionGroup.filter((campaignId) => !campaignIds.includes(campaignId));
      await tx
        .update(schema.campaigns)
        .set({
          executionGroupId: null,
        })
        .where(and(eq(schema.campaigns.tenantId, tenantId), inArray(schema.campaigns.id, campaignIdsToRemoveFromExecutionGroup)));

      const campaignIdsToAddToExecutionGroup = campaignIds.filter((campaignId) => !currentCampaignIdsInExecutionGroup.includes(campaignId));
      await tx
        .update(schema.campaigns)
        .set({
          executionGroupId: executionGroupId,
        })
        .where(and(eq(schema.campaigns.tenantId, tenantId), inArray(schema.campaigns.id, campaignIdsToAddToExecutionGroup)));

      return result;
    });

    return result;
  };

  remove = async ({ tenantId, executionGroupId }: { tenantId: TypeTenant['id']; executionGroupId: TypeExecutionGroup['id'] }) => {
    const result = await db.transaction(async (tx) => {
      await tx
        .update(schema.campaigns)
        .set({
          executionGroupId: null,
        })
        .where(and(eq(schema.campaigns.tenantId, tenantId), eq(schema.campaigns.executionGroupId, executionGroupId)));
      const [result] = await tx
        .delete(schema.executionGroups)
        .where(and(eq(schema.executionGroups.tenantId, tenantId), eq(schema.executionGroups.id, executionGroupId)))
        .returning();

      return result;
    });

    return result;
  };

  getMany = async ({
    tenantId,
    params: { statusList, textSearch, quantity, page, orderDirection, orderBy },
  }: {
    tenantId: TypeTenant['id'];
    params: {
      statusList: TypeExecutionGroup['status'][];
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

    const executionGroups = await db
      .select({
        campaignsCount: sql<number>`count(${schema.campaigns.id})`.mapWith(Number),
        createdAt: schema.executionGroups.createdAt,
        id: schema.executionGroups.id,
        name: schema.executionGroups.name,
        onlyCampaignsPreviouslyExecuted: schema.executionGroups.onlyCampaignsPreviouslyExecuted,
        onlyOneCampaignPerPageLoad: schema.executionGroups.onlyOneCampaignPerPageLoad,
        status: schema.executionGroups.status,
        tenantId: schema.executionGroups.tenantId,
        updatedAt: schema.executionGroups.updatedAt,
        waitForEveryCampaignToBeEvaluated: schema.executionGroups.waitForEveryCampaignToBeEvaluated,
      })
      .from(schema.executionGroups)
      .where(and(eq(schema.executionGroups.tenantId, tenantId), ilike(schema.executionGroups.name, treatedTextSearch), inArray(schema.executionGroups.status, statusList)))
      .leftJoin(schema.campaigns, eq(schema.campaigns.executionGroupId, schema.executionGroups.id))
      .groupBy(schema.executionGroups.id)
      .orderBy(sort(schema.executionGroups[orderBy]))
      .limit(quantity)
      .offset(page * quantity);

    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.executionGroups)
      .where(and(eq(schema.executionGroups.tenantId, tenantId), ilike(schema.executionGroups.name, treatedTextSearch)));

    return {
      count: Number(count),
      executionGroups,
    };
  };

  get = async ({ tenantId, executionGroupId }: { tenantId: TypeTenant['id']; executionGroupId: TypeExecutionGroup['id'] }) => {
    const result = await db.query.executionGroups.findFirst({
      where: and(eq(schema.executionGroups.tenantId, tenantId), eq(schema.executionGroups.id, executionGroupId)),
      with: {
        campaigns: {
          columns: {
            requirements: false,
            triggers: false,
            variations: false,
          },
        },
      },
    });

    if (result) {
      const { campaigns, ...executionGroup } = result;
      return {
        campaigns,
        executionGroup,
      };
    }
    return result;
  };

  getAllExecutionGroupsForScript = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const executionGroups = await db.query.executionGroups.findMany({
      columns: {
        id: true,
        name: true,
        onlyCampaignsPreviouslyExecuted: true,
        onlyOneCampaignPerPageLoad: true,
        waitForEveryCampaignToBeEvaluated: true,
      },
      where: and(eq(schema.executionGroups.tenantId, tenantId), eq(schema.executionGroups.status, 'active')),
      with: {
        campaigns: {
          columns: {
            id: true,
            triggers: true,
            variations: true,
          },
          where: eq(schema.campaigns.status, 'active'),
        },
      },
    });
    return executionGroups
      .filter((executionGroup) => {
        const campaigns = executionGroup.campaigns.filter((campaign) => {
          const itHasVariationsWithSomething = campaign.variations.some(
            (variation) => (variation.html.length > 0 || variation.css.length > 0 || variation.javascript.length > 0) && variation.traffic > 0,
          );
          const itHasTriggers = campaign.triggers.length > 0;
          return itHasVariationsWithSomething && itHasTriggers;
        });
        return campaigns.length > 0;
      })
      .map((executionGroup) => ({
        ...executionGroup,
        campaigns: executionGroup.campaigns.map((campaign) => campaign.id),
      }));
  };
}
