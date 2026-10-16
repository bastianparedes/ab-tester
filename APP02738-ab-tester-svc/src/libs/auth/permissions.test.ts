import { describe, expect, it } from 'vitest';
import { getStringPermission } from './permissions';

describe('getStringPermission', () => {
  it('formats feature permissions without a tenant', () => {
    expect(getStringPermission({ action: 'read', feature: 'campaign' })).toBe('feature.campaign.action.read');
  });

  it('formats feature permissions with a tenant', () => {
    expect(getStringPermission({ action: 'update', feature: 'user', tenantId: 42 })).toBe('tenant.42.feature.user.action.update');
  });

  it('keeps tenant zero in the tenant-scoped permission', () => {
    expect(getStringPermission({ action: 'delete', feature: 'role', tenantId: 0 })).toBe('tenant.0.feature.role.action.delete');
  });
});
