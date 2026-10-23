import { type OpenAPIObject, type ResponseObject } from '@nestjs/swagger';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { appendZodResponseSchemas, registerZodResponseSchema } from '../zod-openapi';

describe('Zod response schema generation', () => {
  it('exports the response contract as an OpenAPI component and updates the operation response', () => {
    const responseSchema = z.object({
      createdAt: z.date().meta({ format: 'date-time', type: 'string' }),
      id: z.number().int(),
    });
    registerZodResponseSchema('ExampleController', 'get', responseSchema);

    const document = {
      components: { schemas: {} },
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/example': {
          get: {
            operationId: 'ExampleController_get',
            responses: { '200': { description: 'Returns an example.' } },
          },
        },
      },
    } as OpenAPIObject;

    appendZodResponseSchemas(document);

    const response = document.paths['/example']?.get?.responses['200'] as ResponseObject | undefined;
    const schemaRef = response?.content?.['application/json']?.schema;
    expect(schemaRef).toEqual({ $ref: '#/components/schemas/ExampleController_get_Response' });
    expect(document.components?.schemas?.ExampleController_get_Response).toMatchObject({
      properties: {
        createdAt: { format: 'date-time', type: 'string' },
        id: { type: 'integer' },
      },
      type: 'object',
    });
  });

  it('moves recursive Zod definitions into OpenAPI components and rewrites references', () => {
    let nodeSchema: z.ZodType;
    nodeSchema = z.lazy(() =>
      z.object({
        children: z.array(nodeSchema),
        type: z.literal('node'),
      }),
    );
    registerZodResponseSchema('RecursiveController', 'get', z.object({ node: nodeSchema }));

    const document = {
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/example': {
          get: {
            operationId: 'ExampleController_get',
            responses: { '200': { description: 'Returns an example.' } },
          },
        },
        '/recursive': {
          get: {
            operationId: 'RecursiveController_get',
            responses: { '200': { description: 'Recursive response.' } },
          },
        },
      },
    } as OpenAPIObject;

    appendZodResponseSchemas(document);

    expect(document.components?.schemas?.RecursiveController_get_Response___schema0).toBeDefined();
    expect(JSON.stringify(document.components?.schemas)).toContain('#/components/schemas/RecursiveController_get_Response___schema0');
  });

  it('creates missing OpenAPI containers, skips empty media entries, and leaves schemas without examples untouched', () => {
    registerZodResponseSchema('NoExampleController', 'get', z.unknown());
    registerZodResponseSchema('NoExampleController', 'get', z.object({ ignored: z.string() }));
    registerZodResponseSchema('RootRefController', 'get', z.string().meta({ $ref: '#' }));
    registerZodResponseSchema('ExternalRefController', 'get', z.string().meta({ $ref: '#/components/schemas/Existing' }));

    const document = {
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/example': {
          get: {
            operationId: 'ExampleController_get',
            responses: { '200': { description: 'Returns an example.' } },
          },
        },
        '/external-ref': {
          get: {
            operationId: 'ExternalRefController_get',
            responses: { '200': { description: 'External reference' } },
          },
        },
        '/ignored': null,
        '/no-example': {
          get: {
            operationId: 'NoExampleController_get',
            responses: {
              '201': { content: { 'application/json': {}, 'text/plain': null }, description: 'Created' },
              '204': { description: 'Also created' },
            },
          },
        },
        '/recursive': {
          get: {
            operationId: 'RecursiveController_get',
            responses: { '200': { description: 'Recursive response.' } },
          },
        },
        '/root-ref': {
          get: {
            operationId: 'RootRefController_get',
            responses: { '200': { description: 'Root reference' } },
          },
        },
      },
    } as unknown as OpenAPIObject;

    appendZodResponseSchemas(document);

    const response = document.paths['/no-example']?.get?.responses['201'] as ResponseObject | undefined;
    expect(document.components?.schemas?.NoExampleController_get_Response).toEqual({});
    expect(response?.content?.['application/json']?.schema).toEqual({
      $ref: '#/components/schemas/NoExampleController_get_Response',
    });
    expect(response?.content?.['application/json']?.example).toBeUndefined();
    expect(document.components?.schemas?.RootRefController_get_Response).toMatchObject({
      $ref: '#/components/schemas/RootRefController_get_Response',
    });
    expect(document.components?.schemas?.ExternalRefController_get_Response).toMatchObject({ $ref: '#/components/schemas/Existing' });
  });

  it('reports missing operations and invalid success responses', async () => {
    const assertFailure = async (responses: Record<string, unknown> | undefined, expectedMessage: string, operationId?: string, omitPaths = false) => {
      vi.resetModules();
      const { appendZodResponseSchemas: append, registerZodResponseSchema: register } = await vi.importActual<typeof import('../zod-openapi')>('../zod-openapi');
      register('FailureController', 'get', z.object({ id: z.number() }));

      const document = {
        info: { title: 'Test API', version: '1.0' },
        openapi: '3.0.0',
        ...(omitPaths
          ? {}
          : {
              paths: {
                '/failure': {
                  get: {
                    ...(operationId === undefined ? {} : { operationId }),
                    responses: responses ?? {},
                  },
                },
              },
            }),
      } as OpenAPIObject;

      expect(() => append(document)).toThrow(expectedMessage);
    };

    await assertFailure(undefined, 'Swagger response schema refers to missing operation FailureController_get', undefined, true);
    await assertFailure(
      {
        '199': { description: 'Early hints' },
        '302': { description: 'Redirect' },
        '400': { description: 'Bad request' },
        default: { description: 'Fallback' },
      },
      'Swagger operation FailureController_get has no success response',
      'FailureController_get',
    );
    await assertFailure({ '200': undefined }, 'Swagger success response 200 for FailureController_get is missing', 'FailureController_get');
    await assertFailure({ '200': { $ref: '#/components/responses/Success' } }, 'Swagger response 200 for FailureController_get must be expanded', 'FailureController_get');

    vi.resetModules();
    const { appendZodResponseSchemas: append, registerZodResponseSchema: register } = await vi.importActual<typeof import('../zod-openapi')>('../zod-openapi');
    register('FailureController', 'get', z.object({ id: z.number() }));
    let operationIdReads = 0;
    const document = {
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/failure': {
          get: {
            get operationId() {
              operationIdReads++;
              return operationIdReads === 1 ? 'FailureController_get' : undefined;
            },
            responses: { '400': { description: 'Bad request' } },
          },
        },
      },
    } as OpenAPIObject;
    expect(() => append(document)).toThrow('Swagger operation <unknown> has no success response');
  });
});
