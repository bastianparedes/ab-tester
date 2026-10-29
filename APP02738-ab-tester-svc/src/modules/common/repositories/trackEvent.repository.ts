import type { TypeOrderCampaignsBy } from '@ab-tester/constants/types/campaign';
import type { TypeDirection } from '@ab-tester/constants/types/constants';
import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import type { TypeTrackEvent, TypeTrackEventUpdatable } from '@ab-tester/constants/types/trackEvents';
import { TypeUser } from '@ab-tester/constants/types/user';
import { ConflictException, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import db from './postgres/client';
import * as schema from './postgres/schema';

@Injectable()
export class TrackEventRepository {
  create = async ({ tenantId, values, userId }: { tenantId: TypeTenant['id']; values: TypeTrackEventUpdatable; userId: TypeUser['id'] }) => {
    const [result] = await db
      .insert(schema.trackEvents)
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
    trackEventId,
    values,
    userId,
  }: {
    tenantId: TypeTenant['id'];
    trackEventId: TypeTrackEvent['id'];
    values: TypeTrackEventUpdatable;
    userId: TypeUser['id'];
  }) => {
    const [result] = await db
      .update(schema.trackEvents)
      .set({ ...values, updatedBy: userId })
      .where(and(eq(schema.trackEvents.tenantId, tenantId), eq(schema.trackEvents.id, trackEventId)))
      .returning();

    return result;
  };

  remove = async ({ tenantId, trackEventId }: { tenantId: TypeTenant['id']; trackEventId: TypeTrackEvent['id'] }) => {
    const audiences = await db
      .select({
        id: schema.audiences.id,
      })
      .from(schema.audiences)
      .where(sql`
        jsonb_path_exists(
          requirements,
          '$.**.trackEventId ? (@ == $id)',
          ${JSON.stringify({ id: trackEventId })}
        )
      `)
      .limit(1);

    if (audiences.length > 0) throw new ConflictException(`Audiences with id ${audiences.map((aud) => aud.id).join(', ')} are using this Track event`);

    const [result] = await db
      .delete(schema.trackEvents)
      .where(and(eq(schema.trackEvents.tenantId, tenantId), eq(schema.trackEvents.id, trackEventId)))
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
      orderBy: TypeOrderCampaignsBy;
    };
  }) => {
    const sort = {
      asc,
      desc,
    }[orderDirection];

    const treatedTextSearch = `%${textSearch.trim()}%`;

    const trackEvents = await db
      .select({
        createdAt: schema.trackEvents.createdAt,
        id: schema.trackEvents.id,
        name: schema.trackEvents.name,
        status: schema.trackEvents.status,
        tenantId: schema.trackEvents.tenantId,
        updatedAt: schema.trackEvents.updatedAt,
      })
      .from(schema.trackEvents)
      .where(
        and(
          eq(schema.trackEvents.tenantId, tenantId),
          or(ilike(schema.trackEvents.name, treatedTextSearch), sql`${schema.trackEvents.javascript}::text ILIKE ${treatedTextSearch}`),
        ),
      )
      .orderBy(sort(schema.trackEvents[orderBy]))
      .limit(quantity)
      .offset(page * quantity);

    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.trackEvents)
      .where(and(eq(schema.trackEvents.tenantId, tenantId), ilike(schema.trackEvents.name, treatedTextSearch)));

    return {
      count: Number(count),
      trackEvents,
    };
  };

  getAllForAudience = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const result = await db.query.trackEvents.findMany({
      columns: {
        id: true,
        name: true,
      },
      where: eq(schema.trackEvents.tenantId, tenantId),
    });

    return result;
  };

  get = async ({ tenantId, trackEventId }: { tenantId: TypeTenant['id']; trackEventId: TypeTrackEvent['id'] }) => {
    const result = await db.query.trackEvents.findFirst({
      where: and(eq(schema.trackEvents.tenantId, tenantId), eq(schema.trackEvents.id, trackEventId)),
    });

    return result;
  };

  getAllTrackEventsForScript = async ({ tenantId }: { tenantId: TypeTenant['id'] }) => {
    const trackEvents = await db.query.trackEvents.findMany({
      columns: {
        id: true,
        javascript: true,
        multipleTimes: true,
        name: true,
      },
      where: and(eq(schema.trackEvents.tenantId, tenantId), eq(schema.trackEvents.status, 'active')),
    });
    return trackEvents.filter((trackEvent) => {
      return trackEvent.javascript.length > 0;
    });
  };
}
