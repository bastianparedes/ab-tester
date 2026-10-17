import { describe, expect, it } from 'vitest';
import { nodeRequirementSchema } from '../requirementsValidator';

describe('nodeRequirementSchema', () => {
  it.each([
    { data: { comparator: 'equal', name: 'session', value: 'active' }, type: 'cookie' },
    { data: { comparator: 'exists', name: 'session' }, type: 'cookie' },
    { data: { comparator: 'contains', name: 'experiment', value: 'variant' }, type: 'localStorage' },
    { data: { comparator: 'doesNotExist', name: 'experiment' }, type: 'sessionStorage' },
    { data: { comparator: 'isNot', name: 'source', value: 'email' }, type: 'queryParam' },
    { data: { javascript: 'return true;', name: 'custom check' }, type: 'custom' },
    { data: { comparator: 'equal', device: 'mobile' }, type: 'device' },
    { data: { comparator: 'contains', value: '/offers' }, type: 'url' },
    { data: { id: 12 }, type: 'audience' },
  ])('accepts $type requirements', (requirement) => {
    expect(nodeRequirementSchema.safeParse({ data: { children: [requirement], operator: 'and' }, type: 'node' }).success).toBe(true);
  });

  it('accepts nested nodes with either boolean operator', () => {
    const nested = {
      data: {
        children: [{ data: { children: [], operator: 'or' }, type: 'node' }],
        operator: 'and',
      },
      type: 'node',
    };

    expect(nodeRequirementSchema.safeParse(nested).success).toBe(true);
  });

  it.each([
    { data: { children: [], operator: 'xor' }, type: 'node' },
    { data: { children: [{ data: { comparator: 'equal', name: 'x' }, type: 'cookie' }], operator: 'and' }, type: 'node' },
    { data: { children: [{ data: { javascript: 'const = 1;', name: 'custom' }, type: 'custom' }], operator: 'and' }, type: 'node' },
    { data: { children: [{ data: { comparator: 'equal', device: 'tablet' }, type: 'device' }], operator: 'and' }, type: 'node' },
  ])('rejects invalid requirement trees: %o', (requirement) => {
    expect(nodeRequirementSchema.safeParse(requirement).success).toBe(false);
  });
});
