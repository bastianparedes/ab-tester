import fs from 'node:fs';
import { InternalServerErrorException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScriptService } from '../script.service';

const tenantId = 9;

const createService = ({ cachedScript = null }: { cachedScript?: string | null } = {}) => {
  const calls = {
    audiences: [] as unknown[],
    cacheDelete: [] as unknown[],
    cacheSave: [] as unknown[],
    campaigns: [] as unknown[],
    executionGroups: [] as unknown[],
    lifecycleHooks: [] as unknown[],
    trackEvents: [] as unknown[],
  };
  const campaign = {
    id: 11,
    name: 'Spring offer',
    requirements: {
      data: {
        children: [
          { data: { javascript: 'return true;', name: 'custom' }, type: 'custom' },
          {
            data: { children: [{ data: { javascript: 'return false;', name: 'nested' }, type: 'custom' }], operator: 'or' },
            type: 'node',
          },
        ],
        operator: 'and',
      },
      type: 'node',
    },
    triggers: [
      { data: { javascript: 'return true;', name: 'custom trigger' }, id: 1, type: 'custom' },
      { data: {}, id: 2, type: 'pageLoad' },
    ],
    variations: [{ css: 'main { color: red; }', html: '<main> Offer </main>', id: 1, javascript: 'return true;', name: 'A', traffic: 100 }],
  };
  const executionGroups = [{ id: 21, name: 'Main group' }];
  const trackEvents = [{ getData: 'return { amount: 1 };', id: 31, name: 'Purchase' }];
  const audiences = [{ id: 41, name: 'Customers' }];
  const lifecycleHooks = [
    { id: 51, javascript: 'async () => { return true; }', option: 'campaignStart' },
    { id: 52, javascript: 'async () => { return false; }', option: 'scriptEnd' },
  ];
  const service = new ScriptService(
    {
      getAllCampaignsForScript: async (input: unknown) => {
        calls.campaigns.push(input);
        return [campaign];
      },
    } as never,
    {
      getAllExecutionGroupsForScript: async (input: unknown) => {
        calls.executionGroups.push(input);
        return executionGroups;
      },
    } as never,
    {
      getAllTrackEventsForScript: async (input: unknown) => {
        calls.trackEvents.push(input);
        return trackEvents;
      },
    } as never,
    {
      getAllAudiencesForScript: async (input: unknown) => {
        calls.audiences.push(input);
        return audiences;
      },
    } as never,
    {
      getAllLifecycleHooksForScript: async (input: unknown) => {
        calls.lifecycleHooks.push(input);
        return lifecycleHooks;
      },
    } as never,
    {
      scripts: {
        del: async (input: unknown) => calls.cacheDelete.push(input),
        get: async () => cachedScript,
        save: async (input: unknown) => calls.cacheSave.push(input),
      },
    } as never,
  );

  return { calls, service };
};

describe('ScriptService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns cached scripts without reading repositories', async () => {
    const { calls, service } = createService({ cachedScript: 'cached bundle' });

    await expect(service.getScript({ tenantId })).resolves.toBe('cached bundle');
    expect(calls.campaigns).toEqual([]);
    expect(calls.cacheSave).toEqual([]);
  });

  it('generates and caches a script with minified data and executable callbacks', async () => {
    const { calls, service } = createService();

    const script = await service.getScript({ tenantId });

    expect(script).toContain('window.ab_tester');
    expect(script).toContain('Spring offer');
    expect(script).toContain('color:red');
    expect(script).toContain('<main>Offer</main>');
    expect(calls.campaigns).toEqual([{ tenantId }]);
    expect(calls.executionGroups).toEqual([{ tenantId }]);
    expect(calls.trackEvents).toEqual([{ tenantId }]);
    expect(calls.audiences).toEqual([{ tenantId }]);
    expect(calls.lifecycleHooks).toEqual([{ tenantId }]);
    expect(calls.cacheSave).toHaveLength(1);
    expect(calls.cacheSave[0]).toMatchObject({ code: script, tenantId });
  }, 15_000);

  it('regenerates and caches a script when the cache is empty', async () => {
    const { calls, service } = createService({ cachedScript: null });

    const script = await service.getScript({ tenantId });

    expect(script).toContain('window.ab_tester');
    expect(calls.cacheSave).toHaveLength(1);
  });

  it('populates the cache and returns the generated script', async () => {
    const { calls, service } = createService();

    const script = await service.populateScript({ tenantId });

    expect(calls.cacheSave).toEqual([{ code: script, tenantId }]);
  });

  it('clears the script cache for the tenant', async () => {
    const { calls, service } = createService();

    await expect(service.clear({ tenantId })).resolves.toBeUndefined();
    expect(calls.cacheDelete).toEqual([{ tenantId }]);
  });

  it('throws when the generated script file is missing', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const { service } = createService();

    await expect(service.getScript({ tenantId })).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
