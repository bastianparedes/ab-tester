import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CampaignsController, getCampaignsQuerySchema } from '../index';

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
