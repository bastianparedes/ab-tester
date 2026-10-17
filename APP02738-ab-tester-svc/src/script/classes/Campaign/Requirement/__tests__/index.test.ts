import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Requirement from '../index';

const createRequirement = (children: unknown[], operator: 'and' | 'or' = 'and', audiences: unknown[] = []) =>
  new Requirement({ data: { children, operator }, type: 'node' } as never, audiences as never);

describe('campaign Requirement', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { cookie: 'session=active' });
    vi.stubGlobal('navigator', { userAgent: 'iPhone' });
    vi.stubGlobal('localStorage', { getItem: (key: string) => (key === 'feature' ? 'enabled' : null) });
    vi.stubGlobal('sessionStorage', { getItem: (key: string) => (key === 'source' ? 'email' : null) });
    vi.stubGlobal('location', { href: 'https://example.test/offers', search: '?campaign=spring' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each([
    { data: { comparator: 'equal', name: 'session', value: 'active' }, type: 'cookie' },
    { data: { comparator: 'equal', name: 'feature', value: 'enabled' }, type: 'localStorage' },
    { data: { comparator: 'equal', name: 'source', value: 'email' }, type: 'sessionStorage' },
    { data: { comparator: 'equal', name: 'campaign', value: 'spring' }, type: 'queryParam' },
    { data: { comparator: 'contains', value: 'offers' }, type: 'url' },
    { data: { comparator: 'equal', device: 'mobile' }, type: 'device' },
  ])('evaluates $type requirements', async (child) => {
    await expect(createRequirement([child]).evaluate()).resolves.toBe(true);
  });

  it('matches desktop device requirements', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Desktop browser' });

    await expect(createRequirement([{ data: { comparator: 'equal', device: 'desktop' }, type: 'device' }]).evaluate()).resolves.toBe(true);
  });

  it('evaluates a matching audience and returns false for an unknown audience', async () => {
    const audiences = [{ evaluate: async () => true, id: 4 }];

    await expect(createRequirement([{ data: { id: 4 }, type: 'audience' }], 'and', audiences).evaluate()).resolves.toBe(true);
    await expect(createRequirement([{ data: { id: 5 }, type: 'audience' }], 'and', audiences).evaluate()).resolves.toBe(false);
  });

  it('evaluates nested nodes and returns false when an audience rejects', async () => {
    await expect(createRequirement([{ data: { children: [], operator: 'and' }, type: 'node' }]).evaluate()).resolves.toBe(true);
    const audiences = [
      {
        evaluate: async () => {
          throw new Error('audience evaluation failed');
        },
        id: 4,
      },
    ];

    await expect(createRequirement([{ data: { id: 4 }, type: 'audience' }], 'and', audiences).evaluate()).resolves.toBe(false);
  });

  it('converts custom requirement results to booleans and catches callback errors', async () => {
    vi.useFakeTimers();
    const trueResult = createRequirement([{ data: { javascript: async () => 'yes', name: 'truthy' }, type: 'custom' }]);
    const falseResult = createRequirement([{ data: { javascript: async () => '', name: 'falsey' }, type: 'custom' }]);
    const errorResult = createRequirement([
      {
        data: {
          javascript: async () => {
            throw new Error('callback failed');
          },
          name: 'error',
        },
        type: 'custom',
      },
    ]);

    await expect(trueResult.evaluate()).resolves.toBe(true);
    await expect(falseResult.evaluate()).resolves.toBe(false);
    await expect(errorResult.evaluate()).resolves.toBe(false);
    await vi.runOnlyPendingTimersAsync();
  });

  it.each([
    { children: [], expected: true, operator: 'and' as const },
    { children: [], expected: false, operator: 'or' as const },
    {
      children: [
        { data: { comparator: 'equal', name: 'feature', value: 'disabled' }, type: 'localStorage' },
        { data: { comparator: 'equal', name: 'feature', value: 'enabled' }, type: 'localStorage' },
      ],
      expected: true,
      operator: 'or' as const,
    },
    {
      children: [
        { data: { comparator: 'equal', name: 'feature', value: 'enabled' }, type: 'localStorage' },
        { data: { comparator: 'equal', name: 'feature', value: 'disabled' }, type: 'localStorage' },
      ],
      expected: false,
      operator: 'and' as const,
    },
  ])('combines child requirements with $operator', async ({ children, operator, expected }) => {
    await expect(createRequirement(children, operator).evaluate()).resolves.toBe(expected);
  });

  it('rejects unsupported logical operators', async () => {
    await expect(createRequirement([], 'xor' as never).evaluate()).resolves.toBe(false);
  });
});
