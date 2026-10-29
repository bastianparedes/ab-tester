import { describe, expect, it } from 'vitest';
import { getExecutionGroupsQuerySchema } from '../request.schema';

describe('execution group query schema', () => {
  it('normalizes status filters', () => {
    const query = { orderBy: 'name', orderDirection: 'asc', page: '1', quantity: '10', textSearch: '' };

    expect(getExecutionGroupsQuerySchema.parse(query)).toMatchObject({ page: 1, quantity: 10, statusList: [] });
    expect(getExecutionGroupsQuerySchema.parse({ ...query, textSearch: undefined }).textSearch).toBe('');
    expect(getExecutionGroupsQuerySchema.parse({ ...query, statusList: 'active' }).statusList).toEqual(['active']);
    expect(getExecutionGroupsQuerySchema.parse({ ...query, statusList: ['active'] }).statusList).toEqual(['active']);
  });
});
