import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AudiencesController } from '../index';
import { copyAudienceSchema, getAudiencesQuerySchema } from '../request.schema';

describe('AudiencesController', () => {
  it('normalizes audience query values and status filters', () => {
    const query = { orderBy: 'name', orderDirection: 'asc', page: '1', textSearch: '' };

    expect(getAudiencesQuerySchema.parse(query)).toMatchObject({ page: 1, statusList: [] });
    expect(getAudiencesQuerySchema.parse({ ...query, textSearch: undefined }).textSearch).toBe('');
    expect(getAudiencesQuerySchema.parse({ ...query, statusList: 'active' }).statusList).toEqual(['active']);
    expect(getAudiencesQuerySchema.parse({ ...query, statusList: ['active'] }).statusList).toEqual(['active']);
    expect(copyAudienceSchema.parse({ extra: true, targetTenantId: 12 })).toEqual({ targetTenantId: 12 });
    expect(copyAudienceSchema.safeParse({ targetTenantId: '12' }).success).toBe(false);
  });

  it('returns audience lists and a selected audience', async () => {
    const audience = { id: 5, name: 'Returning customers' };
    const audiences = [audience];
    const calls: unknown[] = [];
    const controller = new AudiencesController({
      audiences: {
        get: async (input: unknown) => {
          calls.push(input);
          return audience;
        },
        getAllForCampaign: async (input: unknown) => {
          calls.push(input);
          return audiences;
        },
        getMany: async (input: unknown) => {
          calls.push(input);
          return audiences;
        },
      },
    } as never);
    const query = { page: 1, textSearch: '' };

    await expect(controller.getMany(3, query as never)).resolves.toBe(audiences);
    await expect(controller.getAllForCampaign(3)).resolves.toEqual({ audiences });
    await expect(controller.get(3, 5)).resolves.toBe(audience);
    expect(calls).toEqual([{ params: query, tenantId: 3 }, { tenantId: 3 }, { audienceId: 5, tenantId: 3 }]);
  });

  it('throws when an audience is missing', async () => {
    const controller = new AudiencesController({ audiences: { get: async () => null } } as never);

    await expect(controller.get(3, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('copies an audience with its referenced events to a target tenant', async () => {
    const audience = {
      id: 5,
      name: 'Returning customers',
      requirements: {
        data: {
          children: [
            {
              data: { eventCount: 1, quantityOperator: 'atLeast', timeAmount: 30, timeUnit: 'days', trackEventId: 7 },
              type: 'any',
            },
          ],
          operator: 'and',
        },
        type: 'node',
      },
    };
    const calls: unknown[] = [];
    const controller = new AudiencesController({
      audiences: {
        copy: async (input: unknown) => calls.push(input),
        get: async (input: unknown) => {
          calls.push(input);
          return audience;
        },
      },
    } as never);
    const request = {
      user: {
        id: 8,
        roles: [
          {
            permissions: ['tenant.12.feature.audience.action.create', 'tenant.3.feature.track-event.action.read', 'tenant.12.feature.track-event.action.create'],
          },
        ],
      },
    };

    await expect(controller.copy(3, 5, { targetTenantId: 12 }, request as never)).resolves.toEqual({});
    expect(calls).toEqual([
      { audienceId: 5, tenantId: 3 },
      { audienceId: 5, sourceTenantId: 3, targetTenantId: 12, userId: 8 },
    ]);
  });

  it('requires create access to the target audience and its track events', async () => {
    const audience = {
      requirements: {
        data: {
          children: [{ data: { eventCount: 1, quantityOperator: 'atLeast', timeAmount: 30, timeUnit: 'days', trackEventId: 7 }, type: 'any' }],
          operator: 'and',
        },
        type: 'node',
      },
    };
    const controller = new AudiencesController({
      audiences: {
        get: async () => audience,
      },
    } as never);
    const request = { user: { id: 8, roles: [{ permissions: ['tenant.12.feature.audience.action.create'] }] } };

    await expect(controller.copy(3, 5, { targetTenantId: 12 }, request as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires an authenticated user to create and update audiences', async () => {
    const controller = new AudiencesController({ audiences: {} } as never);
    const body = { name: 'New audience', requirements: { data: { children: [], operator: 'and' }, type: 'node' } };

    await expect(controller.create(3, body as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.update(3, 5, body as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates, updates, and removes audiences for the selected tenant and user', async () => {
    const calls: unknown[] = [];
    const controller = new AudiencesController({
      audiences: {
        create: async (input: unknown) => calls.push(input),
        remove: async (input: unknown) => calls.push(input),
        update: async (input: unknown) => calls.push(input),
      },
    } as never);
    const body = { name: 'New audience', requirements: { data: { children: [], operator: 'and' }, type: 'node' } };
    const request = { user: { id: 8 } };

    await expect(controller.create(3, body as never, request as never)).resolves.toEqual({});
    await expect(controller.update(3, 5, body as never, request as never)).resolves.toEqual({});
    await expect(controller.remove(3, 5)).resolves.toEqual({});
    expect(calls).toEqual([
      { tenantId: 3, userId: 8, values: body },
      { audienceId: 5, tenantId: 3, updates: body, userId: 8 },
      { audienceId: 5, tenantId: 3 },
    ]);
  });
});
