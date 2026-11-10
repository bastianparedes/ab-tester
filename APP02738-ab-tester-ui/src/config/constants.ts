const constants = {
  cookieNames: {
    lang: 'lang',
  },
  pages: {
    account: () => '/admin/account',
    audience: ({ tenantId, audienceId }: { tenantId: number; audienceId: number | undefined }) => `/tenants/${tenantId}/ab-test/audiences/${audienceId}`,
    audiences: ({ tenantId }: { tenantId: number }) => `/tenants/${tenantId}/ab-test/audiences`,
    campaign: ({ tenantId, campaignId, cloneFrom }: { tenantId: number; campaignId: number | undefined; cloneFrom?: number }) => {
      const basePath = `/tenants/${tenantId}/ab-test/campaigns/${campaignId}`;
      const queryParams = cloneFrom !== undefined ? `?cloneFrom=${cloneFrom}` : '';
      return basePath + queryParams;
    },
    campaigns: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/ab-test/campaigns`,
    dashboard: () => '/dashboard',
    executionGroup: ({ tenantId, executionGroupId }: { tenantId: number; executionGroupId: number | undefined }) =>
      `/tenants/${tenantId}/ab-test/execution-groups/${executionGroupId}`,
    executionGroups: ({ tenantId }: { tenantId: number }) => `/tenants/${tenantId}/ab-test/execution-groups`,
    home: () => '/',
    lifecycleHook: ({ tenantId, lifecycleHookId, cloneFrom }: { tenantId: number; lifecycleHookId: number | undefined; cloneFrom?: number }) => {
      const basePath = `/tenants/${tenantId}/ab-test/lifecycle-hooks/${lifecycleHookId}`;
      const queryParams = cloneFrom !== undefined ? `?cloneFrom=${cloneFrom}` : '';
      return basePath + queryParams;
    },
    lifecycleHooks: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/ab-test/lifecycle-hooks`,
    logIn: () => '/auth/log-in',
    playground: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/ab-test/playground`,
    playgroundEmbed: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/ab-test/playground/embed`,
    roles: () => '/admin/roles',
    script: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/ab-test/script`,
    tenant: ({ tenantId }: { tenantId: number }) => `/tenants/${tenantId}/ab-test`,
    tenants: () => '/tenants',
    trackEvent: ({ tenantId, trackEventId, cloneFrom }: { tenantId: number; trackEventId: number | undefined; cloneFrom?: number }) => {
      const basePath = `/tenants/${tenantId}/ab-test/track-events/${trackEventId}`;
      const queryParams = cloneFrom !== undefined ? `?cloneFrom=${cloneFrom}` : '';
      return basePath + queryParams;
    },
    trackEvents: ({ tenantId }: { tenantId: number | string }) => `/tenants/${tenantId}/ab-test/track-events`,
    users: () => '/admin/users',
  },
  quantitiesAvailable: [25, 50, 100, 200, 500],
};

export default constants;
