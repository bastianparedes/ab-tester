import { type OpenAPIObject, type OperationObject, type SchemaObject } from '@nestjs/swagger';
import { z } from 'zod';
import { deriveExampleFromZodSchema } from './decorators';

type RegisteredSchema = {
  operationId: string;
  schema: z.ZodType;
};

const registeredSchemas: RegisteredSchema[] = [];

export function registerZodResponseSchema(controllerName: string, handlerName: string, schema: z.ZodType): void {
  const operationId = `${controllerName}_${handlerName}`;
  if (!registeredSchemas.some((entry) => entry.operationId === operationId)) {
    registeredSchemas.push({ operationId, schema });
  }
}

function rewriteReferences(value: unknown, rootName: string): unknown {
  if (Array.isArray(value)) return value.map((item) => rewriteReferences(item, rootName));
  if (!value || typeof value !== 'object') return value;

  const transformed: Record<string, unknown> = {};
  for (const [key, property] of Object.entries(value)) {
    if (key === '$ref' && typeof property === 'string') {
      if (property === '#') {
        transformed[key] = `#/components/schemas/${rootName}`;
      } else if (property.startsWith('#/definitions/')) {
        transformed[key] = `#/components/schemas/${rootName}_${property.slice('#/definitions/'.length)}`;
      } else {
        transformed[key] = property;
      }
    } else {
      transformed[key] = rewriteReferences(property, rootName);
    }
  }
  return transformed;
}

function exportSchema(schema: z.ZodType, rootName: string): Record<string, SchemaObject> {
  const jsonSchema = z.toJSONSchema(schema, {
    io: 'output',
    target: 'openapi-3.0',
    unrepresentable: 'any',
  }) as SchemaObject & { definitions?: Record<string, SchemaObject> };

  const { definitions, ...rootSchema } = jsonSchema;
  const schemas: Record<string, SchemaObject> = {
    [rootName]: rewriteReferences(rootSchema, rootName) as SchemaObject,
  };

  for (const [name, definition] of Object.entries(definitions ?? {})) {
    schemas[`${rootName}_${name}`] = rewriteReferences(definition, rootName) as SchemaObject;
  }

  return schemas;
}

function getSuccessResponseStatus(operation: OperationObject): string {
  const status = Object.keys(operation.responses ?? {})
    .filter((code) => /^\d{3}$/.test(code) && Number(code) >= 200 && Number(code) < 300)
    .sort((left, right) => Number(left) - Number(right))[0];

  if (!status) throw new Error(`Swagger operation ${operation.operationId ?? '<unknown>'} has no success response`);
  return status;
}

export function appendZodResponseSchemas(document: OpenAPIObject): void {
  document.components ??= {};
  document.components.schemas ??= {};
  const componentSchemas = document.components.schemas;

  for (const { operationId, schema } of registeredSchemas) {
    let operation: OperationObject | undefined;
    for (const pathItem of Object.values(document.paths ?? {})) {
      if (!pathItem) continue;
      operation = Object.values(pathItem).find(
        (candidate) => typeof candidate === 'object' && candidate !== null && 'operationId' in candidate && candidate.operationId === operationId,
      ) as OperationObject | undefined;
      if (operation) break;
    }

    if (!operation) throw new Error(`Swagger response schema refers to missing operation ${operationId}`);

    const rootName = `${operationId}_Response`.replace(/[^A-Za-z0-9_.-]/g, '_');
    Object.assign(componentSchemas, exportSchema(schema, rootName));
    const status = getSuccessResponseStatus(operation);
    const response = operation.responses[status];
    if (!response) throw new Error(`Swagger success response ${status} for ${operationId} is missing`);
    if ('$ref' in response) throw new Error(`Swagger response ${status} for ${operationId} must be expanded before attaching its Zod schema`);

    response.content ??= { 'application/json': {} };
    const content = response.content;
    const schemaExample = deriveExampleFromZodSchema(schema);

    for (const media of Object.values(content)) {
      if (!media || typeof media !== 'object') continue;
      delete media.examples;
      media.schema = { $ref: `#/components/schemas/${rootName}` };
      if (schemaExample !== undefined) {
        media.example = schemaExample;
      }
    }
  }
}
