import type { TypePermissions } from './types/permissions';

export const permissions: TypePermissions = {
  audience: {
    create: 'audience.create',
    delete: 'audience.delete',
    read: 'audience.read',
    update: 'audience.update',
  },
  campaign: {
    create: 'campaign.create',
    delete: 'campaign.delete',
    read: 'campaign.read',
    update: 'campaign.update',
  },
  executionGroup: {
    create: 'execution-group.create',
    delete: 'execution-group.delete',
    read: 'execution-group.read',
    update: 'execution-group.update',
  },
  role: {
    create: 'role.create',
    delete: 'role.delete',
    read: 'role.read',
    update: 'role.update',
  },
  tenant: {
    create: 'tenant.create',
    delete: 'tenant.delete',
    read: 'tenant.read',
    update: 'tenant.update',
  },
  trackEvent: {
    create: 'track-event.create',
    delete: 'track-event.delete',
    read: 'track-event.read',
    update: 'track-event.update',
  },
  user: {
    create: 'user.create',
    delete: 'user.delete',
    read: 'user.read',
    update: 'user.update',
  },
};
