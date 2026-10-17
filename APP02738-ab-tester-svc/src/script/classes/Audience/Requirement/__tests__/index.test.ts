import { describe, expect, it } from 'vitest';
import { indexedDBCrud } from '../../../IndexedDB';
import Requirement from '../index';

const baseData = {
  eventCount: 1,
  quantityOperator: 'atLeast',
  timeAmount: 2,
  timeUnit: 'days',
};

const createRequirement = (children: unknown[], operator: 'and' | 'or' = 'and') => new Requirement({ data: { children, operator }, type: 'node' } as never);

const addValues = async (trackEventId: number, values: unknown[]) => {
  for (const value of values) {
    await indexedDBCrud.add(String(trackEventId), { date: new Date(), value });
  }
};

describe('audience Requirement', () => {
  it('evaluates string restrictions against recent event values', async () => {
    const trackEventId = 1;
    await addValues(trackEventId, ['member', 'guest']);
    const requirement = {
      data: { ...baseData, comparator: 'equal', trackEventId, value: 'member' },
      type: 'string',
    };

    await expect(createRequirement([requirement]).evaluate()).resolves.toBe(true);
  });

  it('evaluates numeric restrictions and counts matching events', async () => {
    const trackEventId = 2;
    await addValues(trackEventId, [5, 12]);
    const requirement = {
      data: { ...baseData, comparator: 'equal', trackEventId, value: 5 },
      type: 'number',
    };

    await expect(createRequirement([requirement]).evaluate()).resolves.toBe(true);
  });

  it('evaluates boolean restrictions', async () => {
    const trackEventId = 3;
    await addValues(trackEventId, [true, false]);
    const requirement = {
      data: { ...baseData, comparator: 'equal', trackEventId, value: true },
      type: 'boolean',
    };

    await expect(createRequirement([requirement]).evaluate()).resolves.toBe(true);
  });

  it('counts any event values without applying a value comparator', async () => {
    const trackEventId = 4;
    await addValues(trackEventId, [true, false]);
    const requirement = { data: { ...baseData, eventCount: 2, trackEventId }, type: 'any' };

    await expect(createRequirement([requirement]).evaluate()).resolves.toBe(true);
  });

  it('evaluates nested nodes with and/or operators', async () => {
    await addValues(5, ['member']);
    await addValues(6, [7]);
    const stringRequirement = { data: { ...baseData, comparator: 'equal', trackEventId: 5, value: 'member' }, type: 'string' };
    const numberRequirement = { data: { ...baseData, comparator: 'equal', trackEventId: 6, value: 7 }, type: 'number' };
    const nested = { data: { children: [stringRequirement], operator: 'or' }, type: 'node' };

    await expect(createRequirement([nested, numberRequirement], 'and').evaluate()).resolves.toBe(true);
    await expect(createRequirement([nested, numberRequirement], 'or').evaluate()).resolves.toBe(true);
  });

  it('returns false when IndexedDB evaluation fails', async () => {
    const requirement = {
      data: { ...baseData, trackEventId: 999, value: true },
      type: 'any',
    };

    await expect(createRequirement([requirement]).evaluate()).resolves.toBe(false);
  });
});
