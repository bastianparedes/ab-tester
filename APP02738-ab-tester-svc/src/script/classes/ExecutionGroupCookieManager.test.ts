import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionGroupCookieManager } from './ExecutionGroupCookieManager';

const cookieName = 'ab_tester_register_execution_groups_v1';

const saveCookie = (value: unknown) => {
  document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(value))}`;
};

describe('ExecutionGroupCookieManager', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { cookie: '' });
    vi.stubGlobal('window', { location: { hostname: 'example.test' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates default cookie state when inserting into a missing cookie', () => {
    const manager = new ExecutionGroupCookieManager(7);

    expect(manager.insertCampaignId(12)).toEqual({ executionGroups: { 7: { campaignsExecuted: [12] } } });
  });

  it('recovers from malformed cookie JSON', () => {
    document.cookie = `${cookieName}=not-json`;
    const manager = new ExecutionGroupCookieManager(7);

    expect(manager.insertCampaignId(12)).toEqual({ executionGroups: { 7: { campaignsExecuted: [12] } } });
  });

  it('adds a campaign to existing group state without duplicating ids', () => {
    saveCookie({ executionGroups: { 7: { campaignsExecuted: [12] } } });
    const manager = new ExecutionGroupCookieManager(7);

    expect(manager.insertCampaignId(12)).toEqual({ executionGroups: { 7: { campaignsExecuted: [12] } } });
    expect(manager.insertCampaignId(13)).toEqual({ executionGroups: { 7: { campaignsExecuted: [12, 13] } } });
  });

  it('initializes missing groups and campaign lists when inserting', () => {
    saveCookie({});
    const manager = new ExecutionGroupCookieManager(7);

    expect(manager.insertCampaignId(12)).toEqual({ executionGroups: { 7: { campaignsExecuted: [12] } } });
  });

  it('deletes an existing campaign and leaves other ids intact', () => {
    saveCookie({ executionGroups: { 7: { campaignsExecuted: [12, 13] } } });
    const manager = new ExecutionGroupCookieManager(7);

    expect(manager.deleteCampaignId(12)).toEqual({ executionGroups: { 7: { campaignsExecuted: [13] } } });
  });

  it('returns an empty campaign list for missing groups', () => {
    saveCookie({ executionGroups: {} });
    const manager = new ExecutionGroupCookieManager(7);

    expect(manager.getCampaignIds()).toEqual([]);
  });

  it('returns campaign ids for an existing group', () => {
    saveCookie({ executionGroups: { 7: { campaignsExecuted: [12, 13] } } });
    const manager = new ExecutionGroupCookieManager(7);

    expect(manager.getCampaignIds()).toEqual([12, 13]);
  });
});
