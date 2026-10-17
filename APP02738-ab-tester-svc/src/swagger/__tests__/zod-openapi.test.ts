import { type OpenAPIObject, type ResponseObject } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';
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
});
