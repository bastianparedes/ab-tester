import { abTesterCallDebugPanel, abTesterCampaignId, abTesterIgnoreRequirements, abTesterVariationId } from '@ab-tester/constants/debuggerPanel';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { initExecutionGroups, initSpecificCampaign } = vi.hoisted(() => ({
  initExecutionGroups: vi.fn(),
  initSpecificCampaign: vi.fn(),
}));

vi.mock('../forced', () => ({ initSpecificCampaign }));
vi.mock('../normal', () => ({ initExecutionGroups }));

import { initCampaigns } from '../index';

describe('initCampaigns', () => {
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const session = new Map<string, string>();

  beforeEach(() => {
    vi.clearAllMocks();
    session.clear();
    window.ab_tester.serviceBaseUrl = 'http://localhost:4000';
    Object.defineProperty(globalThis, 'location', { configurable: true, value: { search: '' } });
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => session.get(key) ?? null,
        setItem: (key: string, value: string) => session.set(key, value),
      },
    });
  });

  afterEach(() => {
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
    else Reflect.deleteProperty(globalThis, 'location');
    if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  });

  it('starts execution groups when there is no forced campaign in session storage', () => {
    initCampaigns();

    expect(initExecutionGroups).toHaveBeenCalledOnce();
    expect(initSpecificCampaign).not.toHaveBeenCalled();
  });

  it('persists forced campaign query parameters and initializes that campaign', () => {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: {
        search: `?${abTesterCampaignId}=12&${abTesterVariationId}=3&${abTesterIgnoreRequirements}=true`,
      },
    });

    initCampaigns();

    expect(session.get(abTesterCampaignId)).toBe('12');
    expect(session.get(abTesterVariationId)).toBe('3');
    expect(session.get(abTesterIgnoreRequirements)).toBe('true');
    expect(initSpecificCampaign).toHaveBeenCalledWith({ campaignId: 12, ignoreRequirements: true, variationId: 3 });
    expect(initExecutionGroups).not.toHaveBeenCalled();
  });

  it('uses default requirements when the ignore flag is absent from the forced query', () => {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { search: `?${abTesterCampaignId}=12&${abTesterVariationId}=3` },
    });

    initCampaigns();

    expect(session.has(abTesterIgnoreRequirements)).toBe(false);
    expect(initSpecificCampaign).toHaveBeenCalledWith({ campaignId: 12, ignoreRequirements: false, variationId: 3 });
  });

  it('loads forced campaign values from session storage when the query is empty', () => {
    session.set(abTesterCampaignId, '8');
    session.set(abTesterVariationId, '4');
    session.set(abTesterIgnoreRequirements, 'false');

    initCampaigns();

    expect(initSpecificCampaign).toHaveBeenCalledWith({ campaignId: 8, ignoreRequirements: false, variationId: 4 });
  });

  it('ignores an incomplete forced campaign query pair', () => {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { search: `?${abTesterCampaignId}=12` },
    });

    initCampaigns();

    expect(session.has(abTesterCampaignId)).toBe(false);
    expect(initSpecificCampaign).not.toHaveBeenCalled();
    expect(initExecutionGroups).toHaveBeenCalledOnce();
  });

  it('stores the debug panel preference from the query string', () => {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { search: `?${abTesterCallDebugPanel}=false` },
    });

    initCampaigns();

    expect(session.get(abTesterCallDebugPanel)).toBe('false');
    expect(initExecutionGroups).toHaveBeenCalledOnce();
  });

  it('loads the debug panel when its query preference is enabled', async () => {
    window.ab_tester.serviceBaseUrl = 'data:text/javascript,export default true; //';
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { search: `?${abTesterCallDebugPanel}=true` },
    });

    initCampaigns();

    expect(session.get(abTesterCallDebugPanel)).toBe('true');
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
