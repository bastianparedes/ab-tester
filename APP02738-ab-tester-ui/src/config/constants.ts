import { TypeTenant } from '@ab-tester/constants/types/tenant';

type TypeAction = 'create' | 'delete' | 'read' | 'update';
type Props = {
  tenantId?: null | TypeTenant['id'];
  feature: 'role' | 'user' | 'audience' | 'campaign' | 'execution-group' | 'track-event' | 'tenant';
  action: TypeAction;
};

export const getStringPermission = ({ tenantId = null, feature, action }: Props) => {
  if (tenantId === null) return `feature.${feature}.action.${action}`;
  return `tenant.${tenantId}.feature.${feature}.action.${action}`;
};

const constants = {
  cookieNames: {
    lang: 'lang',
  },
  pages: {
    account: () => '/admin/account',
    audience: ({ tenantId, audienceId }: { tenantId: number; audienceId: number | undefined }) => `/tenants/${tenantId}/audiences/${audienceId}`,
    audiences: ({ tenantId }: { tenantId: number }) => `/tenants/${tenantId}/audiences`,
    campaign: ({ tenantId, campaignId, cloneFrom }: { tenantId: number; campaignId: number | undefined; cloneFrom?: number }) => {
      const basePath = `/tenants/${tenantId}/campaigns/${campaignId}`;
      const queryParams = cloneFrom !== undefined ? `?cloneFrom=${cloneFrom}` : '';
      return basePath + queryParams;
    },
    campaigns: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/campaigns`,
    executionGroup: ({ tenantId, executionGroupId }: { tenantId: number; executionGroupId: number | undefined }) =>
      `/tenants/${tenantId}/execution-groups/${executionGroupId}`,
    executionGroups: ({ tenantId }: { tenantId: number }) => `/tenants/${tenantId}/execution-groups`,
    home: () => '/',
    lifecycleHook: ({ tenantId, lifecycleHookId, cloneFrom }: { tenantId: number; lifecycleHookId: number | undefined; cloneFrom?: number }) => {
      const basePath = `/tenants/${tenantId}/lifecycle-hooks/${lifecycleHookId}`;
      const queryParams = cloneFrom !== undefined ? `?cloneFrom=${cloneFrom}` : '';
      return basePath + queryParams;
    },
    lifecycleHooks: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/lifecycle-hooks`,
    logIn: () => '/auth/log-in',
    playground: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/playground`,
    playgroundEmbed: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/playground/embed`,
    roles: () => '/admin/roles',
    script: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/script`,
    tenants: () => '/tenants',
    trackEvent: ({ tenantId, trackEventId, cloneFrom }: { tenantId: number; trackEventId: number | undefined; cloneFrom?: number }) => {
      const basePath = `/tenants/${tenantId}/track-events/${trackEventId}`;
      const queryParams = cloneFrom !== undefined ? `?cloneFrom=${cloneFrom}` : '';
      return basePath + queryParams;
    },
    trackEvents: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/track-events`,
    users: () => '/admin/users',
  },
  quantitiesAvailable: [25, 50, 100, 200, 500],
};

export default constants;
