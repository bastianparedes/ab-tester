import { describe, expect, it } from 'vitest';
import { NodeRequirementSchema } from './requirementsValidator';

const baseData = {
  eventCount: 2,
  quantityOperator: 'atLeast',
  timeAmount: 7,
  timeUnit: 'days',
  trackEventId: 10,
};

describe('NodeRequirementSchema', () => {
  it.each([
    { data: { ...baseData, comparator: 'contains', value: 'paid' }, type: 'string' },
    { data: { ...baseData, comparator: 'moreThan', value: 5 }, type: 'number' },
    { data: { ...baseData, comparator: 'equal', value: true }, type: 'boolean' },
    { data: baseData, type: 'any' },
  ])('accepts $type audience requirements', (requirement) => {
    expect(NodeRequirementSchema.safeParse({ data: { children: [requirement], operator: 'and' }, type: 'node' }).success).toBe(true);
  });

  it('accepts nested audience requirement nodes', () => {
    const node = {
      data: { children: [{ data: baseData, type: 'any' }], operator: 'or' },
      type: 'node',
    };

    expect(NodeRequirementSchema.safeParse(node).success).toBe(true);
  });

  it.each([
    { data: { ...baseData, comparator: 'unknown', value: 'paid' }, type: 'string' },
    { data: { ...baseData, comparator: 'equal', value: '5' }, type: 'number' },
    { data: { ...baseData, comparator: 'moreThan', value: true }, type: 'boolean' },
    { data: { ...baseData, timeUnit: 'weeks' }, type: 'any' },
    { data: { children: [], operator: 'xor' }, type: 'node' },
  ])('rejects invalid audience requirements: %o', (requirement) => {
    expect(NodeRequirementSchema.safeParse(requirement).success).toBe(false);
  });
});
