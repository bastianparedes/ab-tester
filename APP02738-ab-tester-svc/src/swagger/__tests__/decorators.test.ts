import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { audienceSchema } from '../../controllers/audiences.controller/request.schema';
import { ApiZodBody, ApiZodQuery, deriveExampleFromZodSchema, zodQueryParameters } from '../decorators';

vi.mock('zod', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zod')>();
  return { ...actual, z: { ...actual.z, toJSONSchema: vi.fn(actual.z.toJSONSchema) } };
});

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it('derives primitive, array, object, and named property examples', () => {
    expect(deriveExampleFromZodSchema(z.object({ status: z.string(), enabled: z.boolean(), count: z.number(), value: z.null() }))).toEqual({
      count: 0,
      enabled: false,
      status: 'active',
      value: null,
    });
    expect(deriveExampleFromZodSchema(z.array(z.unknown()))).toEqual([]);
    expect(deriveExampleFromZodSchema(z.object({}))).toBeUndefined();
    expect(deriveExampleFromZodSchema(z.string(), 'other')).toBe('string');
    expect(deriveExampleFromZodSchema(z.string().meta({ $ref: '#/missing' }))).toBeUndefined();
    expect(deriveExampleFromZodSchema(z.string().meta({ $ref: '#' }))).toBe('string');
    expect(deriveExampleFromZodSchema(z.literal('fixed'))).toBe('fixed');
    expect(
      deriveExampleFromZodSchema(
        z.object({
          createdAt: z.string(),
          css: z.string(),
          description: z.string(),
          domain: z.string(),
          email: z.string(),
          html: z.string(),
          id: z.number(),
          javascript: z.string(),
          password: z.string(),
        }),
      ),
    ).toEqual({
      createdAt: '2024-01-01T00:00:00.000Z',
      css: '.example { color: red; }',
      description: 'Example description',
      domain: 'example.com',
      email: 'user@example.com',
      html: '<div>Example</div>',
      id: 1,
      javascript: 'async () => true',
      password: 'password123',
    });
  });

  it('creates body and query decorators with explicit and inferred examples', () => {
    const schema = z.object({
      labels: z.array(z.string()).optional(),
      name: z.string(),
    });

    expect(ApiZodBody(schema, 'Body', { labels: ['new'], name: 'Ada' })).toBeTypeOf('function');
    expect(ApiZodBody(z.unknown(), 'Unknown body')).toBeTypeOf('function');
    expect(zodQueryParameters(schema)).toEqual([
      {
        description: undefined,
        example: ['string'],
        name: 'labels',
        required: false,
        schema: { items: { type: 'string' }, type: 'array' },
        explode: true,
        style: 'form',
      },
      {
        description: undefined,
        example: 'Example Name',
        name: 'name',
        required: true,
        schema: { type: 'string' },
      },
    ]);
    expect(ApiZodQuery(schema)).toBeTypeOf('function');
    expect(zodQueryParameters(z.string())).toEqual([]);
    expect(ApiZodQuery(z.string())).toBeTypeOf('function');
    vi.mocked(z.toJSONSchema).mockReturnValueOnce({
      properties: { undocumented: { type: 'array' } },
      type: 'object',
    } as never);
    expect(zodQueryParameters(z.string())).toEqual([
      {
        description: undefined,
        example: undefined,
        name: 'undocumented',
        required: false,
        schema: { type: 'array' },
        explode: true,
        style: 'form',
      },
    ]);
  });

  it('handles unsupported and cyclic JSON Schema shapes when deriving examples', () => {
    const repeatedSchema = { type: 'string' };
    vi.mocked(z.toJSONSchema).mockReturnValueOnce({
      properties: {
        anyOf: { anyOf: [{ type: 'string' }] },
        arrayWithoutItems: { type: 'array' },
        badReference: { $ref: '#/properties/absent' },
        constValue: { const: 'fixed' },
        invalidReference: { $ref: false },
        nullReference: { $ref: '#/properties/nullValue' },
        nullValue: null,
        objectWithoutProperties: { type: 'object' },
        objectWithoutExamples: { properties: {}, type: 'object' },
        repeatedA: repeatedSchema,
        repeatedB: repeatedSchema,
        rootReference: { $ref: '#' },
        status: { type: 'unknown' },
        integer: { type: 'integer' },
        mystery: { type: 'unknown' },
        tupleWithoutItems: { items: [], type: 'array' },
        undefinedConst: { const: undefined, type: 'string' },
      },
      type: 'object',
    } as never);

    const examples = deriveExampleFromZodSchema(z.string());
    expect(examples).toEqual({
      arrayWithoutItems: [],
      anyOf: 'string',
      constValue: 'fixed',
      invalidReference: 1,
      integer: 0,
      repeatedA: '2024-01-01T00:00:00.000Z',
      status: 'active',
      tupleWithoutItems: [],
      undefinedConst: 'string',
    });
    expect(examples).not.toHaveProperty('mystery');
  });
});
