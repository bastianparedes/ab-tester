import { describe, expect, it } from 'vitest';
import { tenantSchema } from '../request.schema';

describe('tenant schema', () => {
  it('validates tenant values and strips unknown fields', () => {
    expect(tenantSchema.parse({ description: '', domain: 'example.test', extra: true, name: 'Acme' })).toEqual({
      description: '',
      domain: 'example.test',
      name: 'Acme',
    });
  });
});
