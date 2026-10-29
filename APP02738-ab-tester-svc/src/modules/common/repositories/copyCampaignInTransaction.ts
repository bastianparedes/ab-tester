import type { TypeAudience } from '@ab-tester/constants/types/audience';
import type { TypeCampaign, TypeNodeRequirement, TypeRequirement } from '@ab-tester/constants/types/campaign';
import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import type { TypeUser } from '@ab-tester/constants/types/user';
import { NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { copyAudienceInTransaction } from './copyAudienceInTransaction';
import db from './postgres/client';
import * as schema from './postgres/schema';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const copyCampaignInTransaction = async ({
  campaign,
  sourceTenantId,
  targetTenantId,
  userId,
  tx,
  executionGroupId = null,
  remappedAudienceIds = new Map<number, number>(),
  remappedTrackEventIds = new Map<number, number>(),
}: {
  campaign: Pick<TypeCampaign, 'name' | 'requirements' | 'status' | 'triggers' | 'variations'>;
  sourceTenantId: TypeTenant['id'];
  targetTenantId: TypeTenant['id'];
  userId: TypeUser['id'];
  tx: DbTransaction;
  executionGroupId?: number | null;
  remappedAudienceIds?: Map<number, number>;
  remappedTrackEventIds?: Map<number, number>;
}) => {
  const audienceIds = new Set<number>();
  const collectAudienceIds = (node: TypeNodeRequirement) => {
    for (const requirement of node.data.children) {
      if (requirement.type === 'node') collectAudienceIds(requirement);
      else if (requirement.type === 'audience') audienceIds.add(requirement.data.id);
    }
  };
  collectAudienceIds(campaign.requirements);

  for (const audienceId of audienceIds) {
    if (remappedAudienceIds.has(audienceId)) continue;
    const audience: TypeAudience | undefined = await tx.query.audiences.findFirst({
      where: and(eq(schema.audiences.tenantId, sourceTenantId), eq(schema.audiences.id, audienceId)),
    });
    if (!audience) throw new NotFoundException(`Audience ${audienceId} used by this campaign was not found`);
    const copiedAudience = await copyAudienceInTransaction({
      audience,
      remappedTrackEventIds,
      sourceTenantId,
      targetTenantId,
      tx,
      userId,
    });
    remappedAudienceIds.set(audienceId, copiedAudience.id);
  }

  const remapRequirement = (requirement: TypeRequirement): TypeRequirement => {
    if (requirement.type === 'node') {
      return {
        ...requirement,
        data: { ...requirement.data, children: requirement.data.children.map(remapRequirement) },
      };
    }
    if (requirement.type !== 'audience') return requirement;
    const targetAudienceId = remappedAudienceIds.get(requirement.data.id);
    if (targetAudienceId === undefined) throw new NotFoundException(`Audience ${requirement.data.id} used by this campaign was not copied`);
    return { ...requirement, data: { ...requirement.data, id: targetAudienceId } };
  };
  const requirements: TypeNodeRequirement = {
    ...campaign.requirements,
    data: { ...campaign.requirements.data, children: campaign.requirements.data.children.map(remapRequirement) },
  };

  const [copiedCampaign] = await tx
    .insert(schema.campaigns)
    .values({
      createdBy: userId,
      executionGroupId,
      name: campaign.name,
      requirements,
      status: campaign.status,
      tenantId: targetTenantId,
      triggers: campaign.triggers,
      updatedBy: userId,
      variations: campaign.variations,
    })
    .returning();
  return copiedCampaign;
};
