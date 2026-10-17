import { ApiBody, ApiQuery, type SchemaObject } from '@nestjs/swagger';
import { z } from 'zod';

function inferExampleFromPropertyName(name: string): unknown {
  const normalized = name.toLowerCase();

  if (normalized.includes('email')) return 'user@example.com';
  if (normalized.includes('password')) return 'password123';
  if (normalized.includes('name')) return 'Example Name';
  if (normalized.includes('description')) return 'Example description';
  if (normalized.includes('domain')) return 'example.com';
  if (normalized.includes('javascript')) return 'async () => true';
  if (normalized.includes('html')) return '<div>Example</div>';
  if (normalized.includes('css')) return '.example { color: red; }';
  if (normalized.includes('status')) return 'active';
  if (normalized.includes('id')) return 1;
  if (normalized.includes('date') || normalized.includes('at')) return '2024-01-01T00:00:00.000Z';

  return undefined;
}

function resolveJsonSchemaRef(rootSchema: SchemaObject, schema: SchemaObject | undefined): SchemaObject | undefined {
  if (!schema || typeof schema !== 'object') return undefined;

  if ('$ref' in schema && typeof schema.$ref === 'string') {
    const ref = schema.$ref;
    if (ref === '#') return rootSchema;

    const segments = ref
      .replace(/^#\//, '')
      .split('/')
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
    let current: unknown = rootSchema;
    for (const segment of segments) {
      if (!current || typeof current !== 'object' || !(segment in current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return (current as SchemaObject | undefined) ?? undefined;
  }

  return schema;
}

function deriveExampleFromJsonSchema(schema: SchemaObject | undefined, propertyName?: string, rootSchema: SchemaObject = schema ?? {}, seen = new WeakSet<object>()): unknown {
  if (!schema || typeof schema !== 'object') return undefined;

  const resolvedSchema = resolveJsonSchemaRef(rootSchema, schema);
  if (!resolvedSchema || typeof resolvedSchema !== 'object') return undefined;
  if (seen.has(resolvedSchema)) return undefined;
  seen.add(resolvedSchema);

  if (resolvedSchema.example !== undefined) return resolvedSchema.example;
  if (resolvedSchema.default !== undefined) return resolvedSchema.default;

  const schemaAny = resolvedSchema as any;
  if (schemaAny.const !== undefined) return schemaAny.const;
  if (resolvedSchema.enum && resolvedSchema.enum.length > 0) return resolvedSchema.enum[0];

  const variants = [resolvedSchema.anyOf, resolvedSchema.oneOf, resolvedSchema.allOf].filter(Array.isArray);
  for (const variantGroup of variants) {
    for (const variant of variantGroup as SchemaObject[]) {
      const example = deriveExampleFromJsonSchema(variant, propertyName, rootSchema, seen);
      if (example !== undefined) return example;
    }
  }

  if (resolvedSchema.type === 'array' || Array.isArray(resolvedSchema.items)) {
    const itemSchema = Array.isArray(resolvedSchema.items) ? resolvedSchema.items[0] : resolvedSchema.items;
    const itemExample = itemSchema ? deriveExampleFromJsonSchema(itemSchema as SchemaObject, propertyName, rootSchema, seen) : undefined;
    return itemExample === undefined ? [] : [itemExample];
  }

  if (resolvedSchema.type === 'object' || resolvedSchema.properties) {
    const example: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(resolvedSchema.properties ?? {})) {
      const nestedExample = deriveExampleFromJsonSchema(value as SchemaObject, name, rootSchema, seen);
      if (nestedExample !== undefined) {
        example[name] = nestedExample;
      }
    }
    return Object.keys(example).length > 0 ? example : undefined;
  }

  if (resolvedSchema.type === 'string') return inferExampleFromPropertyName(propertyName ?? 'value') ?? 'string';
  if (resolvedSchema.type === 'number' || resolvedSchema.type === 'integer') return inferExampleFromPropertyName(propertyName ?? 'value') ?? 0;
  if (resolvedSchema.type === 'boolean') return false;
  if (resolvedSchema.type === 'null') return null;

  return inferExampleFromPropertyName(propertyName ?? 'value');
}

export function deriveExampleFromZodSchema(schema: z.ZodType, propertyName?: string): unknown {
  const jsonSchema = z.toJSONSchema(schema, { io: 'input', target: 'openapi-3.0', unrepresentable: 'any' }) as SchemaObject;
  return deriveExampleFromJsonSchema(jsonSchema, propertyName, jsonSchema);
}

export function ApiZodBody<T extends z.ZodType>(schema: T, description: string, example?: z.input<T>): MethodDecorator {
  const openApiSchema = z.toJSONSchema(schema, { io: 'input', target: 'openapi-3.0', unrepresentable: 'any' }) as SchemaObject;
  const bodyExample = example ?? deriveExampleFromZodSchema(schema);

  return ApiBody({
    description,
    ...(bodyExample === undefined ? {} : { examples: { example: { summary: 'Request example', value: bodyExample } } }),
    schema: openApiSchema,
  });
}

export function zodQueryParameters(schema: z.ZodType) {
  const openApiSchema = z.toJSONSchema(schema, { io: 'input', target: 'openapi-3.0', unrepresentable: 'any' }) as SchemaObject;
  const properties = (openApiSchema.properties ?? {}) as Record<string, SchemaObject>;
  const required = new Set(openApiSchema.required ?? []);
  const shape = schema instanceof z.ZodObject ? schema.shape : {};

  return Object.entries(properties).map(([name, propertySchema]) => {
    const { xOpenApiOptional, ...property } = propertySchema as SchemaObject & { xOpenApiOptional?: boolean };
    const zodProperty = shape[name] as z.ZodType | undefined;
    const example = property.example ?? (zodProperty ? deriveExampleFromZodSchema(zodProperty, name) : undefined);

    return {
      description: property.description,
      example,
      name,
      required: required.has(name) && xOpenApiOptional !== true,
      schema: property,
      ...(property.type === 'array' ? { explode: true, style: 'form' as const } : {}),
    };
  });
}

export function ApiZodQuery(schema: z.ZodType): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    for (const parameter of zodQueryParameters(schema)) {
      ApiQuery(parameter)(target, propertyKey, descriptor);
    }
  };
}
