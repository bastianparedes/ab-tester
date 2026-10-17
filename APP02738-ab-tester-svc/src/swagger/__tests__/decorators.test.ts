import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiZodBody } from '../decorators';

describe('ApiZodBody', () => {
  it('creates a request decorator when no example is supplied', () => {
    expect(ApiZodBody(z.object({ name: z.string() }), 'Request body')).toBeTypeOf('function');
  });
});
