import 'fake-indexeddb/auto';
import { vi } from 'vitest';

vi.mock('redis', () => ({
  createClient: () => ({
    connect: () => Promise.resolve(),
    del: () => Promise.resolve(0),
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK'),
  }),
}));

process.env.DATABASE_URL_POSTGRES ||= 'postgres://test:test@localhost/test';
process.env.DATABASE_URL_REDIS ||= 'redis://localhost:6379';
process.env.JWT_SECRET ||= 'unit-test-secret';
process.env.SALT_ROUNDS ||= '10';
process.env.SERVICE_BASE_URL ||= 'http://localhost:4000';

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    ab_tester: {
      audiencesData: [],
      campaignsData: [],
      executionGroupsData: [],
      lifecycleHooksData: {
        campaignEnd: [],
        campaignStart: [],
        executionGroupEnd: [],
        executionGroupStart: [],
        scriptEnd: [],
        scriptStart: [],
        trackEventEnd: [],
        trackEventStart: [],
        variantCampaignEnd: [],
        variantCampaignStart: [],
      },
      serviceBaseUrl: 'http://localhost:4000',
      trackEventsData: Array.from({ length: 20 }, (_, index) => ({ id: index + 1 })),
    },
  },
  writable: true,
});
