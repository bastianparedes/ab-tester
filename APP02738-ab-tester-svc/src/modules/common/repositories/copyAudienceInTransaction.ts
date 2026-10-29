import type { TypeAudience, TypeNodeRequirement, TypeRequirement } from '@ab-tester/constants/types/audience';
import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import type { TypeUser } from '@ab-tester/constants/types/user';
import { NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import db from './postgres/client';
import * as schema from './postgres/schema';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const copyAudienceInTransaction = async ({
  audience,
  sourceTenantId,
  targetTenantId,
  remappedTrackEventIds = new Map<number, number>(),
  userId,
  tx,
}: {
  audience: Pick<TypeAudience, 'name' | 'requirements'>;
  sourceTenantId: TypeTenant['id'];
  targetTenantId: TypeTenant['id'];
  remappedTrackEventIds?: Map<number, number>;
  userId: TypeUser['id'];
  tx: DbTransaction;
}) => {
  const sourceTrackEventIds = new Set<number>();
  const collectTrackEventIds = (node: TypeNodeRequirement) => {
    for (const requirement of node.data.children) {
      if (requirement.type === 'node') collectTrackEventIds(requirement);
      else sourceTrackEventIds.add(requirement.data.trackEventId);
    }
  };
  collectTrackEventIds(audience.requirements);

  const missingTrackEventIds = [...sourceTrackEventIds].filter((id) => !remappedTrackEventIds.has(id));
  if (missingTrackEventIds.length > 0) {
    const sourceTrackEvents = await tx
      .select({
        id: schema.trackEvents.id,
        javascript: schema.trackEvents.javascript,
        multipleTimes: schema.trackEvents.multipleTimes,
        name: schema.trackEvents.name,
        status: schema.trackEvents.status,
      })
      .from(schema.trackEvents)
      .where(and(eq(schema.trackEvents.tenantId, sourceTenantId), inArray(schema.trackEvents.id, missingTrackEventIds)));
    if (sourceTrackEvents.length !== missingTrackEventIds.length) throw new NotFoundException('A track event used by this audience was not found');

    for (const trackEvent of sourceTrackEvents) {
      const [createdTrackEvent] = await tx
        .insert(schema.trackEvents)
        .values({
          createdBy: userId,
          javascript: trackEvent.javascript,
          multipleTimes: trackEvent.multipleTimes,
          name: trackEvent.name,
          status: trackEvent.status,
          tenantId: targetTenantId,
          updatedBy: userId,
        })
        .returning({ id: schema.trackEvents.id });
      remappedTrackEventIds.set(trackEvent.id, createdTrackEvent.id);
    }
  }

  const remapRequirement = (requirement: TypeRequirement): TypeRequirement => {
    if (requirement.type === 'node') {
      return {
        ...requirement,
        data: { ...requirement.data, children: requirement.data.children.map(remapRequirement) },
      };
    }
    const targetTrackEventId = remappedTrackEventIds.get(requirement.data.trackEventId);
    if (targetTrackEventId === undefined) throw new NotFoundException(`Track event ${requirement.data.trackEventId} used by this audience was not copied`);
    return { ...requirement, data: { ...requirement.data, trackEventId: targetTrackEventId } } as TypeRequirement;
  };

  const requirements: TypeNodeRequirement = {
    ...audience.requirements,
    data: { ...audience.requirements.data, children: audience.requirements.data.children.map(remapRequirement) },
  };
  const [createdAudience] = await tx
    .insert(schema.audiences)
    .values({
      createdBy: userId,
      name: audience.name,
      requirements,
      tenantId: targetTenantId,
      updatedBy: userId,
    })
    .returning({ id: schema.audiences.id });
  return createdAudience;
};
