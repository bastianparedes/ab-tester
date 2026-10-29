import fs from 'node:fs';
import { InternalServerErrorException } from '@nestjs/common';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScriptService } from '../../../ab-test/services/script.service';

vi.mock('html-minifier-terser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('html-minifier-terser')>();
  return { ...actual, minify: vi.fn(actual.minify) };
});

const tenantId = 9;

const createService = ({
  cachedScript = null,
  css = 'main { color: red; }',
  html = '<main> Offer </main>',
}: {
  cachedScript?: string | null;
  css?: string;
  html?: string;
} = {}) => {
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
          { data: { javascript: 'async () => { return true; }', name: 'custom' }, type: 'custom' },
          {
            data: { children: [{ data: { javascript: 'async () => { return false; }', name: 'nested' }, type: 'custom' }], operator: 'or' },
            type: 'node',
          },
          { data: { id: 41 }, type: 'audience' },
        ],
        operator: 'and',
      },
      type: 'node',
    },
    triggers: [
      { data: { javascript: 'async () => { return true; }', name: 'custom trigger' }, id: 1, type: 'custom' },
      { data: {}, id: 2, type: 'pageLoad' },
    ],
    variations: [{ css, html, id: 1, javascript: 'async () => { return true; }', name: 'A', traffic: 100 }],
  };
  const executionGroups = [{ id: 21, name: 'Main group' }];
  const trackEvents = [{ id: 31, javascript: 'async () => { return { amount: 1 }; }', name: 'Purchase' }];
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

  it('logs HTML minification failures and falls back to empty variation assets', async () => {
    const htmlError = new Error('invalid script markup');
    vi.mocked(minifyHtml).mockRejectedValueOnce(htmlError);
    const cssResult = new CleanCSS({ level: 2 }).minify('main { color: red; }');
    cssResult.errors.push('invalid CSS');
    vi.spyOn(CleanCSS.prototype, 'minify').mockReturnValueOnce(cssResult);
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { service } = createService();

    const script = await service.getScript({ tenantId });

    expect(errorLog).toHaveBeenCalledWith('Error al minificar HTML:', htmlError);
    expect(script).not.toContain('color:red');
    expect(script).not.toContain('<main>Offer</main>');
  });
});
