import { describe, expect, it } from 'vitest';
import constants, { getStringPermission } from '../constants';

describe('getStringPermission', () => {
  it('formats global and tenant-scoped permissions', () => {
    expect(getStringPermission({ action: 'read', feature: 'user' })).toBe('feature.user.action.read');
    expect(getStringPermission({ action: 'update', feature: 'campaign', tenantId: null })).toBe('feature.campaign.action.update');
    expect(getStringPermission({ action: 'delete', feature: 'campaign', tenantId: 42 })).toBe('tenant.42.feature.campaign.action.delete');
  });
});

describe('route builders', () => {
  it('builds global routes', () => {
    expect(constants.pages.account()).toBe('/admin/account');
    expect(constants.pages.home()).toBe('/');
    expect(constants.pages.logIn()).toBe('/auth/log-in');
    expect(constants.pages.roles()).toBe('/admin/roles');
    expect(constants.pages.tenants()).toBe('/tenants');
    expect(constants.pages.users()).toBe('/admin/users');
  });

  it('builds tenant collection and demo routes', () => {
    expect(constants.pages.audiences({ tenantId: 7 })).toBe('/tenants/7/audiences');
    expect(constants.pages.campaigns({ tenantId: 7 })).toBe('/tenants/7/campaigns');
    expect(constants.pages.executionGroups({ tenantId: 7 })).toBe('/tenants/7/execution-groups');
    expect(constants.pages.lifecycleHooks({ tenantId: 7 })).toBe('/tenants/7/lifecycle-hooks');
    expect(constants.pages.playground({ tenantId: 7 })).toBe('/tenants/7/playground');
    expect(constants.pages.playgroundEmbed({ tenantId: 7 })).toBe('/tenants/7/playground/embed');
    expect(constants.pages.script({ tenantId: 7 })).toBe('/tenants/7/script');
    expect(constants.pages.trackEvents({ tenantId: 7 })).toBe('/tenants/7/track-events');
  });

  it('adds optional clone parameters to detail routes', () => {
    expect(constants.pages.audience({ audienceId: 3, tenantId: 7 })).toBe('/tenants/7/audiences/3');
    expect(constants.pages.audience({ audienceId: undefined, tenantId: 7 })).toBe('/tenants/7/audiences/undefined');
    expect(constants.pages.campaign({ campaignId: 4, tenantId: 7 })).toBe('/tenants/7/campaigns/4');
    expect(constants.pages.campaign({ campaignId: undefined, cloneFrom: 4, tenantId: 7 })).toBe('/tenants/7/campaigns/undefined?cloneFrom=4');
    expect(constants.pages.executionGroup({ executionGroupId: 5, tenantId: 7 })).toBe('/tenants/7/execution-groups/5');
    expect(constants.pages.lifecycleHook({ lifecycleHookId: 6, tenantId: 7 })).toBe('/tenants/7/lifecycle-hooks/6');
    expect(constants.pages.lifecycleHook({ cloneFrom: 6, lifecycleHookId: undefined, tenantId: 7 })).toBe('/tenants/7/lifecycle-hooks/undefined?cloneFrom=6');
    expect(constants.pages.trackEvent({ tenantId: 7, trackEventId: 8 })).toBe('/tenants/7/track-events/8');
    expect(constants.pages.trackEvent({ cloneFrom: 8, tenantId: 7, trackEventId: undefined })).toBe('/tenants/7/track-events/undefined?cloneFrom=8');
  });
});
