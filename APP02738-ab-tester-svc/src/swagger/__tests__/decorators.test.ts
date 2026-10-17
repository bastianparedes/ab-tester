import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { audienceSchema } from '../../controllers/audiences.controller/request.schema';
import { ApiZodBody, deriveExampleFromZodSchema } from '../decorators';

describe('ApiZodBody', () => {
  it('creates a request decorator when no example is supplied', () => {
    expect(ApiZodBody(z.object({ name: z.string() }), 'Request body')).toBeTypeOf('function');
  });

  it('derives the example from the Zod schema when no explicit example is supplied', () => {
    const schema = z.object({
      email: z.string().meta({ example: 'ada@example.com' }),
      name: z.string().meta({ example: 'Ada Lovelace' }),
    });

    expect(deriveExampleFromZodSchema(schema)).toEqual({
      email: 'ada@example.com',
      name: 'Ada Lovelace',
    });
  });

  it('keeps nested requirements in the audience request example', () => {
    expect(deriveExampleFromZodSchema(audienceSchema)).toMatchObject({
      name: 'Example Name',
      requirements: {
        data: {
          children: [
            expect.objectContaining({
              data: expect.objectContaining({
                comparator: 'contains',
                eventCount: 0,
                quantityOperator: 'equal',
                timeAmount: 0,
                timeUnit: 'days',
                trackEventId: 1,
                value: 'string',
              }),
              type: 'string',
            }),
          ],
          operator: 'and',
        },
        type: 'node',
      },
    });
  });
});
