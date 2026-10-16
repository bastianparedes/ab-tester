import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod';

describe('ZodValidationPipe', () => {
  it('returns parsed and coerced data', () => {
    const pipe = new ZodValidationPipe(z.object({ id: z.coerce.number() }));

    expect(pipe.transform({ id: '42' })).toEqual({ id: 42 });
  });

  it('throws a bad request exception with validation issues', () => {
    const pipe = new ZodValidationPipe(z.object({ id: z.number() }));

    expect(() => pipe.transform({ id: 'not a number' })).toThrow(BadRequestException);
  });
});
