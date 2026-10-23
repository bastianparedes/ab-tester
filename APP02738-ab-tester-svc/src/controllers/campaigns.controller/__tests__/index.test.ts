import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CampaignsController } from '../index';
import { copyCampaignSchema, getCampaignsQuerySchema } from '../request.schema';

const body = {
  name: 'Spring campaign',
  requirements: { data: { children: [], operator: 'and' }, type: 'node' },
  status: 'active',
  triggers: [],
  variations: [],
};

describe('CampaignsController', () => {
  it('normalizes campaign query values and status filters', () => {
    const query = { orderBy: 'name', orderDirection: 'asc', page: '1', quantity: '10', textSearch: '' };

    expect(getCampaignsQuerySchema.parse(query)).toMatchObject({ page: 1, quantity: 10, statusList: [] });
    expect(getCampaignsQuerySchema.parse({ ...query, textSearch: undefined }).textSearch).toBe('');
    expect(getCampaignsQuerySchema.parse({ ...query, statusList: 'active' }).statusList).toEqual(['active']);
    expect(getCampaignsQuerySchema.parse({ ...query, statusList: ['active'] }).statusList).toEqual(['active']);
    expect(copyCampaignSchema.parse({ extra: true, targetTenantId: 12 })).toEqual({ targetTenantId: 12 });
    expect(copyCampaignSchema.safeParse({ targetTenantId: '12' }).success).toBe(false);
  });

  it('returns campaign lists and a selected campaign', async () => {
    const campaign = { id: 5, name: 'Spring campaign' };
    const campaigns = [campaign];
    const calls: unknown[] = [];
    const controller = new CampaignsController({
      campaigns: {
        get: vi.fn(async (input: unknown) => {
          calls.push(input);
          return campaign;
        }),
        getAllForExecutionGroup: vi.fn(async (input: unknown) => {
          calls.push(input);
          return campaigns;
        }),
        getMany: vi.fn(async (input: unknown) => {
          calls.push(input);
          return campaigns;
        }),
      },
    } as never);
    const query = { page: 1, textSearch: '' };

    await expect(controller.getMany(3, query as never)).resolves.toBe(campaigns);
    await expect(controller.getAllLightVersion(3)).resolves.toEqual({ campaigns });
    await expect(controller.get(3, 5)).resolves.toBe(campaign);
    expect(calls).toEqual([{ params: query, tenantId: 3 }, { tenantId: 3 }, { campaignId: 5, tenantId: 3 }]);
  });

  it('throws when a campaign is missing', async () => {
    const controller = new CampaignsController({ campaigns: { get: async () => null } } as never);

    await expect(controller.get(3, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('copies a campaign and requires permissions for its audience and track-event dependencies', async () => {
    const campaign = {
      requirements: {
        data: {
          children: [{ data: { id: 6 }, type: 'audience' }],
          operator: 'and',
        },
        type: 'node',
      },
    };
    const audience = {
      requirements: {
        data: {
          children: [{ data: { eventCount: 1, quantityOperator: 'atLeast', timeAmount: 30, timeUnit: 'days', trackEventId: 9 }, type: 'any' }],
          operator: 'and',
        },
        type: 'node',
      },
    };
    const calls: unknown[] = [];
    const controller = new CampaignsController({
      audiences: {
        get: async (input: unknown) => {
          calls.push(input);
          return audience;
        },
      },
      campaigns: {
        copy: async (input: unknown) => calls.push(input),
        get: async (input: unknown) => {
          calls.push(input);
          return campaign;
        },
      },
    } as never);
    const request = {
      user: {
        id: 8,
        roles: [
          {
            permissions: [
              'tenant.12.feature.campaign.action.create',
              'tenant.3.feature.audience.action.read',
              'tenant.12.feature.audience.action.create',
              'tenant.3.feature.track-event.action.read',
              'tenant.12.feature.track-event.action.create',
            ],
          },
        ],
      },
    };

    await expect(controller.copy(3, 5, { targetTenantId: 12 }, request as never)).resolves.toEqual({});
    expect(calls).toEqual([
      { campaignId: 5, tenantId: 3 },
      { audienceId: 6, tenantId: 3 },
      { campaignId: 5, sourceTenantId: 3, targetTenantId: 12, userId: 8 },
    ]);

    const insufficientPermissionsController = new CampaignsController({
      audiences: { get: async () => audience },
      campaigns: { get: async () => campaign },
    } as never);
    const insufficientPermissionsRequest = { user: { id: 8, roles: [{ permissions: ['tenant.12.feature.campaign.action.create'] }] } };
    await expect(insufficientPermissionsController.copy(3, 5, { targetTenantId: 12 }, insufficientPermissionsRequest as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires an authenticated user to create or update campaigns', async () => {
    const controller = new CampaignsController({ campaigns: {} } as never);

    await expect(controller.create(3, body as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.update(3, 5, body as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates, updates, and removes campaigns for the selected tenant and user', async () => {
    const calls: unknown[] = [];
    const controller = new CampaignsController({
      campaigns: {
        create: async (input: unknown) => calls.push(input),
        remove: async (input: unknown) => calls.push(input),
        update: async (input: unknown) => calls.push(input),
      },
    } as never);
    const request = { user: { id: 8 } };

    await expect(controller.create(3, body as never, request as never)).resolves.toEqual({});
    await expect(controller.update(3, 5, body as never, request as never)).resolves.toEqual({});
    await expect(controller.remove(3, 5)).resolves.toEqual({});
    expect(calls).toEqual([
      { tenantId: 3, userId: 8, values: body },
      { campaignId: 5, tenantId: 3, updates: body, userId: 8 },
      { campaignId: 5, tenantId: 3 },
    ]);
  });
});
